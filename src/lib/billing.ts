import { query } from "@/lib/db";

const PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-4o": { input: 0.0000025, output: 0.00001 },
  "openai/gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
  "openai/gpt-3.5-turbo": { input: 0.0000005, output: 0.0000015 },
  "deepseek/deepseek-chat": { input: 0.00000014, output: 0.00000028 },
  "anthropic/claude-3.5-sonnet": { input: 0.000003, output: 0.000015 },
};

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = PRICING[model];
  if (!pricing) {
    return (tokensIn + tokensOut) * 0.000001;
  }
  return tokensIn * pricing.input + tokensOut * pricing.output;
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
