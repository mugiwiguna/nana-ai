import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

const FREE_DAILY_LIMIT = 3_000_000;
const FREE_WEEKLY_LIMIT = 15_000_000;
const FREE_MONTHLY_LIMIT = 50_000_000;
const MIN_TOPUP = 1; // $1
const WITA_OFFSET = 8 * 60 * 60 * 1000;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const topupRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM topups WHERE user_id = $1 AND status = 'success'`,
      [userId]
    );
    const totalTopup = Number(topupRes.rows[0].total);
    const eligible = totalTopup >= MIN_TOPUP;

    const now = new Date();
    const witaNow = new Date(now.getTime() + WITA_OFFSET);

    // Daily: midnight WITA
    const dayStart = new Date(Date.UTC(witaNow.getUTCFullYear(), witaNow.getUTCMonth(), witaNow.getUTCDate()));
    const dayStartUTC = new Date(dayStart.getTime() - WITA_OFFSET);

    // Weekly: Monday 00:00 WITA
    const dayOfWeek = witaNow.getUTCDay();
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monDate = new Date(Date.UTC(witaNow.getUTCFullYear(), witaNow.getUTCMonth(), witaNow.getUTCDate() - daysSinceMon));
    const weekStartUTC = new Date(monDate.getTime() - WITA_OFFSET);

    // Monthly: 1st of current month 00:00 WITA
    const monthStart = new Date(Date.UTC(witaNow.getUTCFullYear(), witaNow.getUTCMonth(), 1));
    const monthStartUTC = new Date(monthStart.getTime() - WITA_OFFSET);

    // Reset at = tomorrow 00:00 WITA
    const tomorrowStart = new Date(Date.UTC(witaNow.getUTCFullYear(), witaNow.getUTCMonth(), witaNow.getUTCDate() + 1));
    const resetAt = new Date(tomorrowStart.getTime() - WITA_OFFSET);

    let dailyUsed = 0, weeklyUsed = 0, monthlyUsed = 0;
    try {
      const usageRes = await query(
        `SELECT
           COALESCE(SUM(CASE WHEN ul.created_at >= $2 THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0) as daily_used,
           COALESCE(SUM(CASE WHEN ul.created_at >= $3 THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0) as weekly_used,
           COALESCE(SUM(CASE WHEN ul.created_at >= $4 THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0) as monthly_used
         FROM usage_logs ul
         JOIN custom_models cm ON ul.model = cm.name
         WHERE ul.user_id = $1
           AND cm.is_free = true`,
        [userId, dayStartUTC.toISOString(), weekStartUTC.toISOString(), monthStartUTC.toISOString()]
      );
      const row = usageRes.rows[0];
      dailyUsed = Number(row.daily_used);
      weeklyUsed = Number(row.weekly_used);
      monthlyUsed = Number(row.monthly_used);
    } catch (e) {
      // usage query failed, default to 0
    }

    const modelsRes = await query(
      `SELECT COUNT(*) as count FROM custom_models WHERE is_free = true AND is_active = true`
    );
    const freeModels = Number(modelsRes.rows[0].count);

    return NextResponse.json({
      eligible,
      totalTopup,
      daily: { used: dailyUsed, limit: FREE_DAILY_LIMIT, remaining: Math.max(0, FREE_DAILY_LIMIT - dailyUsed), percentage: Math.min(100, Math.round((dailyUsed / FREE_DAILY_LIMIT) * 100)) },
      weekly: { used: weeklyUsed, limit: FREE_WEEKLY_LIMIT, remaining: Math.max(0, FREE_WEEKLY_LIMIT - weeklyUsed), percentage: Math.min(100, Math.round((weeklyUsed / FREE_WEEKLY_LIMIT) * 100)) },
      monthly: { used: monthlyUsed, limit: FREE_MONTHLY_LIMIT, remaining: Math.max(0, FREE_MONTHLY_LIMIT - monthlyUsed), percentage: Math.min(100, Math.round((monthlyUsed / FREE_MONTHLY_LIMIT) * 100)) },
      freeModels,
      resetAt: resetAt.toISOString(),
      // Legacy flat fields for backward compat
      used: dailyUsed,
      limit: FREE_DAILY_LIMIT,
      remaining: Math.max(0, FREE_DAILY_LIMIT - dailyUsed),
      percentage: Math.min(100, Math.round((dailyUsed / FREE_DAILY_LIMIT) * 100)),
    });
  } catch (e: any) {
    console.error("free-tier-usage error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
