import { query } from "@/lib/db";

const PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-4o": { input: 0.0000025, output: 0.00001 },
  "openai/gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
  "openai/gpt-3.5-turbo": { input: 0.0000005, output: 0.0000015 },
  "deepseek/deepseek-chat": { input: 0.00000014, output: 0.00000028 },
  "anthropic/claude-3.5-sonnet": { input: 0.000003, output: 0.000015 },
};

// Keep custom model cache in module for hot path (refreshed on mutation)
let customPricingCache: Record<string, { input: number; output: number; providerId: string; isFree: boolean }> | null = null;
let customModelsCacheTs = 0;

async function loadCustomPricing(): Promise<Record<string, { input: number; output: number; providerId: string; isFree: boolean }>> {
  const now = Date.now();
  if (customPricingCache && now - customModelsCacheTs < 30000) return customPricingCache!;

  const res = await query(
    "SELECT m.name, m.input_price, m.output_price, m.provider_id, m.is_free FROM custom_models m WHERE m.is_active = true"
  );
  const map: Record<string, { input: number; output: number; providerId: string; isFree: boolean }> = {};
  for (const row of res.rows) {
    map[row.name] = {
      input: Number(row.input_price),
      output: Number(row.output_price),
      providerId: row.provider_id,
      isFree: row.is_free,
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
    "SELECT upstream_model_name, is_reasoning FROM custom_models WHERE name = $1 AND is_active = true",
    [model]
  );
  if (!mRes.rows[0]) return null;

  return {
    baseUrl: res.rows[0].base_url,
    apiKey: res.rows[0].api_key,
    upstreamModel: mRes.rows[0].upstream_model_name,
    inputPrice: info.input,
    outputPrice: info.output,
    isReasoning: mRes.rows[0].is_reasoning || false,
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

const FREE_TOKEN_LIMIT = 3_000_000;
const MIN_TOPUP = 1; // $1

export async function checkFreeTier(userId: string, model: string): Promise<{ eligible: boolean; remaining: number }> {
  const pricing = await loadCustomPricing();
  const modelInfo = pricing[model];
  if (!modelInfo?.isFree) return { eligible: false, remaining: 0 };

  // Check total topup >= Rp10,000
  const topupRes = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM topups WHERE user_id = $1 AND status = 'success'`,
    [userId]
  );
  if (Number(topupRes.rows[0].total) < MIN_TOPUP) return { eligible: false, remaining: 0 };

  // Check today's free usage
  const now = new Date();
  const shanghaiOffset = 8 * 60 * 60 * 1000;
  const shanghaiDate = new Date(now.getTime() + shanghaiOffset);
  const todayStart = new Date(shanghaiDate.getFullYear(), shanghaiDate.getMonth(), shanghaiDate.getDate());
  const todayStartUTC = new Date(todayStart.getTime() - shanghaiOffset);

  const usageRes = await query(
    `SELECT COALESCE(SUM(ul.tokens_in + ul.tokens_out), 0) as used FROM usage_logs ul JOIN custom_models cm ON ul.model = cm.name WHERE ul.user_id = $1 AND cm.is_free = true AND ul.created_at >= $2`,
    [userId, todayStartUTC.toISOString()]
  );
  const used = Number(usageRes.rows[0].used);
  const remaining = Math.max(0, FREE_TOKEN_LIMIT - used);

  return { eligible: remaining > 0, remaining };
}

export async function logFreeUsage(
  userId: string,
  apiKeyId: string,
  model: string,
  tokensIn: number,
  tokensOut: number
) {
  await query(
    "INSERT INTO usage_logs (user_id, api_key_id, model, tokens_in, tokens_out, cost) VALUES ($1, $2, $3, $4, $5, 0)",
    [userId, apiKeyId, model, tokensIn, tokensOut]
  );
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

/**
 * Token limit periods.
 * Free plan: reset follows calendar (daily=midnight WIB, weekly=Monday, monthly=1st).
 * Paid plan: daily=midnight WIB, weekly=7-day cycle from sub start, monthly=same day as sub start.
 */
export interface TokenLimitResult {
  allowed: boolean;
  limits: {
    daily: { limit: number | null; used: number; remaining: number | null };
    weekly: { limit: number | null; used: number; remaining: number | null };
    monthly: { limit: number | null; used: number; remaining: number | null };
  };
}

export async function checkTokenLimits(userId: string): Promise<TokenLimitResult> {
  // Get active subscription + plan limits
  const subRes = await query(
    `SELECT p.daily_token_limit, p.weekly_token_limit, p.monthly_token_limit, us.starts_at, us.usage_reset_at
     FROM user_subscriptions us
     JOIN plans p ON p.id = us.plan_id
     WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > now()
     ORDER BY us.created_at DESC LIMIT 1`,
    [userId]
  );

  let sub = subRes.rows[0];
  const resetAt = sub?.usage_reset_at ? new Date(sub.usage_reset_at) : null;
  let dailyLimit = sub?.daily_token_limit ? Number(sub.daily_token_limit) : null;
  let weeklyLimit = sub?.weekly_token_limit ? Number(sub.weekly_token_limit) : null;
  let monthlyLimit = sub?.monthly_token_limit ? Number(sub.monthly_token_limit) : null;

  // No active subscription — fall back to free plan limits
  if (!sub) {
    const freePlanRes = await query(
      `SELECT daily_token_limit, weekly_token_limit, monthly_token_limit
       FROM plans WHERE slug = 'free' AND is_active = true LIMIT 1`
    );
    const fp = freePlanRes.rows[0];
    if (fp) {
      dailyLimit = fp.daily_token_limit ? Number(fp.daily_token_limit) : null;
      weeklyLimit = fp.weekly_token_limit ? Number(fp.weekly_token_limit) : null;
      monthlyLimit = fp.monthly_token_limit ? Number(fp.monthly_token_limit) : null;
    }
  }

  // No limits at all → allowed
  if (!dailyLimit && !weeklyLimit && !monthlyLimit) {
    return {
      allowed: true,
      limits: {
        daily: { limit: null, used: 0, remaining: null },
        weekly: { limit: null, used: 0, remaining: null },
        monthly: { limit: null, used: 0, remaining: null },
      },
    };
  }

  const now = new Date();
  const WIB_OFFSET = 7 * 60 * 60 * 1000;

  // Daily window: always calendar-based (midnight WIB)
  const wibNow = new Date(now.getTime() + WIB_OFFSET);
  const dayStart = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()));
  let dayStartUTC = new Date(dayStart.getTime() - WIB_OFFSET);

  // Weekly + Monthly windows: calendar for free, purchase-date cycle for paid
  let weekStartUTC: Date;
  let monthStartUTC: Date;

  if (sub?.starts_at) {
    // Paid plan: cycle based on subscription start date
    const subStart = new Date(sub.starts_at);

    // Weekly: find most recent weekly cycle boundary
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const elapsed = now.getTime() - subStart.getTime();
    const weeksSinceStart = Math.floor(elapsed / msPerWeek);
    weekStartUTC = new Date(subStart.getTime() + weeksSinceStart * msPerWeek);

    // Monthly: 30-day cycle from subscription start
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    const monthsSinceStart = Math.floor(elapsed / msPerMonth);
    monthStartUTC = new Date(subStart.getTime() + monthsSinceStart * msPerMonth);
  } else {
    // Free plan: calendar-based
    // Week start: Monday 00:00 WIB
    const dayOfWeek = wibNow.getUTCDay(); // 0=Sun, 1=Mon...
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monDate = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate() - daysSinceMon));
    weekStartUTC = new Date(monDate.getTime() - WIB_OFFSET);

    // Month start: 1st of current month 00:00 WIB
    const monthStart = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), 1));
    monthStartUTC = new Date(monthStart.getTime() - WIB_OFFSET);
  }

  // After buyback: floor windows to usage_reset_at
  if (resetAt && resetAt > dayStartUTC) dayStartUTC = resetAt;
  if (resetAt && resetAt > weekStartUTC) weekStartUTC = resetAt;
  if (resetAt && resetAt > monthStartUTC) monthStartUTC = resetAt;

  // Query usage for all 3 windows in one shot
  const usageRes = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN created_at >= $2 THEN tokens_in + tokens_out ELSE 0 END), 0) as daily_used,
       COALESCE(SUM(CASE WHEN created_at >= $3 THEN tokens_in + tokens_out ELSE 0 END), 0) as weekly_used,
       COALESCE(SUM(CASE WHEN created_at >= $4 THEN tokens_in + tokens_out ELSE 0 END), 0) as monthly_used
     FROM usage_logs WHERE user_id = $1`,
    [userId, dayStartUTC.toISOString(), weekStartUTC.toISOString(), monthStartUTC.toISOString()]
  );

  const row = usageRes.rows[0];
  const dailyUsed = Number(row.daily_used);
  const weeklyUsed = Number(row.weekly_used);
  const monthlyUsed = Number(row.monthly_used);

  const dailyRemaining = dailyLimit ? Math.max(0, dailyLimit - dailyUsed) : null;
  const weeklyRemaining = weeklyLimit ? Math.max(0, weeklyLimit - weeklyUsed) : null;
  const monthlyRemaining = monthlyLimit ? Math.max(0, monthlyLimit - monthlyUsed) : null;

  const allowed =
    (dailyLimit ? dailyRemaining! > 0 : true) &&
    (weeklyLimit ? weeklyRemaining! > 0 : true) &&
    (monthlyLimit ? monthlyRemaining! > 0 : true);

  return {
    allowed,
    limits: {
      daily: { limit: dailyLimit, used: dailyUsed, remaining: dailyRemaining },
      weekly: { limit: weeklyLimit, used: weeklyUsed, remaining: weeklyRemaining },
      monthly: { limit: monthlyLimit, used: monthlyUsed, remaining: monthlyRemaining },
    },
  };
}

/**
 * Check free tier token limits (daily/weekly/monthly) for free model usage only.
 * Uses calendar-based windows. Returns limits from the free plan in DB.
 * Always checked FIRST before paid plan limits.
 */
export async function checkFreeTierUsage(userId: string): Promise<{
  allowed: boolean;
  limits: {
    daily: { limit: number | null; used: number; remaining: number | null };
    weekly: { limit: number | null; used: number; remaining: number | null };
    monthly: { limit: number | null; used: number; remaining: number | null };
  };
}> {
  const planRes = await query(
    `SELECT daily_token_limit, weekly_token_limit, monthly_token_limit
     FROM plans WHERE slug = 'free' AND is_active = true LIMIT 1`
  );
  const plan = planRes.rows[0];
  if (!plan) {
    return {
      allowed: true,
      limits: {
        daily: { limit: null, used: 0, remaining: null },
        weekly: { limit: null, used: 0, remaining: null },
        monthly: { limit: null, used: 0, remaining: null },
      },
    };
  }

  const dailyLimit = plan.daily_token_limit ? Number(plan.daily_token_limit) : null;
  const weeklyLimit = plan.weekly_token_limit ? Number(plan.weekly_token_limit) : null;
  const monthlyLimit = plan.monthly_token_limit ? Number(plan.monthly_token_limit) : null;

  if (!dailyLimit && !weeklyLimit && !monthlyLimit) {
    return {
      allowed: true,
      limits: {
        daily: { limit: null, used: 0, remaining: null },
        weekly: { limit: null, used: 0, remaining: null },
        monthly: { limit: null, used: 0, remaining: null },
      },
    };
  }

  const now = new Date();
  const WIB_OFFSET = 7 * 60 * 60 * 1000;
  const wibNow = new Date(now.getTime() + WIB_OFFSET);

  // Calendar-based windows
  const dayStart = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()));
  const dayStartUTC = new Date(dayStart.getTime() - WIB_OFFSET);

  const dayOfWeek = wibNow.getUTCDay();
  const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monDate = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate() - daysSinceMon));
  const weekStartUTC = new Date(monDate.getTime() - WIB_OFFSET);

  const monthStart = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), 1));
  const monthStartUTC = new Date(monthStart.getTime() - WIB_OFFSET);

  // Only count free model usage
  const usageRes = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN ul.created_at >= $2 THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0) as daily_used,
       COALESCE(SUM(CASE WHEN ul.created_at >= $3 THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0) as weekly_used,
       COALESCE(SUM(CASE WHEN ul.created_at >= $4 THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0) as monthly_used
     FROM usage_logs ul
     JOIN custom_models cm ON ul.model = cm.name
     WHERE ul.user_id = $1 AND cm.is_free = true`,
    [userId, dayStartUTC.toISOString(), weekStartUTC.toISOString(), monthStartUTC.toISOString()]
  );

  const row = usageRes.rows[0];
  const dailyUsed = Number(row.daily_used);
  const weeklyUsed = Number(row.weekly_used);
  const monthlyUsed = Number(row.monthly_used);

  const dailyRemaining = dailyLimit ? Math.max(0, dailyLimit - dailyUsed) : null;
  const weeklyRemaining = weeklyLimit ? Math.max(0, weeklyLimit - weeklyUsed) : null;
  const monthlyRemaining = monthlyLimit ? Math.max(0, monthlyLimit - monthlyUsed) : null;

  const allowed =
    (dailyLimit ? dailyRemaining! > 0 : true) &&
    (weeklyLimit ? weeklyRemaining! > 0 : true) &&
    (monthlyLimit ? monthlyRemaining! > 0 : true);

  return {
    allowed,
    limits: {
      daily: { limit: dailyLimit, used: dailyUsed, remaining: dailyRemaining },
      weekly: { limit: weeklyLimit, used: weeklyUsed, remaining: weeklyRemaining },
      monthly: { limit: monthlyLimit, used: monthlyUsed, remaining: monthlyRemaining },
    },
  };
}

/**
 * Legacy single-limit check. Use checkTokenLimits for full picture.
 */
export async function checkDailyTokenLimit(userId: string): Promise<{
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
}> {
  const full = await checkTokenLimits(userId);
  return {
    allowed: full.allowed,
    limit: full.limits.daily.limit,
    used: full.limits.daily.used,
    remaining: full.limits.daily.remaining,
  };
}
