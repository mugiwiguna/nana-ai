import { query } from "@/lib/db";

const PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-4o": { input: 0.0000025, output: 0.00001 },
  "openai/gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
  "openai/gpt-3.5-turbo": { input: 0.0000005, output: 0.0000015 },
  "deepseek/deepseek-chat": { input: 0.00000014, output: 0.00000028 },
  "anthropic/claude-3.5-sonnet": { input: 0.000003, output: 0.000015 },
};

// Keep custom model cache in module for hot path (refreshed on mutation)
let customPricingCache: Record<string, { input: number; output: number; providerId: string }> | null = null;
let customModelsCacheTs = 0;

async function loadCustomPricing(): Promise<Record<string, { input: number; output: number; providerId: string }>> {
  const now = Date.now();
  if (customPricingCache && now - customModelsCacheTs < 30000) return customPricingCache!;

  const res = await query(
    "SELECT m.name, m.input_price, m.output_price, m.provider_id FROM custom_models m WHERE m.is_active = true"
  );
  const map: Record<string, { input: number; output: number; providerId: string }> = {};
  for (const row of res.rows) {
    map[row.name] = {
      input: Number(row.input_price),
      output: Number(row.output_price),
      providerId: row.provider_id,
    };
  }
  customPricingCache = map;
  customModelsCacheTs = now;
  return map;
}

export function invalidateCustomPricingCache() {
  customPricingCache = null;
}

export async function getCustomModelInfo(model: string) {
  const pricing = await loadCustomPricing();
  return pricing[model] || null;
}

export async function getCustomModelRoute(model: string) {
  const info = await getCustomModelInfo(model);
  if (!info) return null;

  const res = await query(
    "SELECT base_url, api_key, slug FROM custom_providers WHERE id = $1 AND is_active = true",
    [info.providerId]
  );
  if (!res.rows[0]) return null;

  // Get upstream model name
  const mRes = await query(
    "SELECT upstream_model_name FROM custom_models WHERE name = $1 AND is_active = true",
    [model]
  );
  if (!mRes.rows[0]) return null;

  return {
    baseUrl: res.rows[0].base_url,
    apiKey: res.rows[0].api_key,
    upstreamModel: mRes.rows[0].upstream_model_name,
    inputPrice: info.input,
    outputPrice: info.output,
  };
}

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = PRICING[model];
  if (pricing) {
    return tokensIn * pricing.input + tokensOut * pricing.output;
  }
  // Fallback: ~$0.5/M tokens if unknown
  return (tokensIn + tokensOut) * 0.0000005;
}

export async function validateApiKey(key: string) {
  const res = await query(
    "SELECT u.id, u.balance, a.id as api_key_id FROM api_keys a JOIN users u ON a.user_id = u.id WHERE a.key = $1 AND a.is_active = true",
    [key]
  );
  return res.rows[0] || null;
}

export async function deductBalance(
  userId: string,
  apiKeyId: string,
  model: string,
  tokensIn: number,
  tokensOut: number,
  cost: number
) {
  await query("UPDATE users SET balance = balance - $1 WHERE id = $2", [cost, userId]);
  await query(
    "INSERT INTO usage_logs (user_id, api_key_id, model, tokens_in, tokens_out, cost) VALUES ($1, $2, $3, $4, $5, $6)",
    [userId, apiKeyId, model, tokensIn, tokensOut, cost]
  );
}
