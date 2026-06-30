import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

const FREE_TOKEN_LIMIT = 3_000_000; // 3M tokens per day
const MIN_TOPUP = 10_000; // Rp10,000

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user info
  const userRes = await query(`SELECT id FROM users WHERE email = $1`, [session.user.email]);
  if (userRes.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = userRes.rows[0].id;

  // Check eligibility: total topup >= Rp10,000
  const topupRes = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM topups WHERE user_id = $1 AND status = 'success'`,
    [userId]
  );
  const totalTopup = Number(topupRes.rows[0].total);
  const eligible = totalTopup >= MIN_TOPUP;

  // Get today's free tier usage (Asia/Shanghai = WITA = UTC+8)
  const now = new Date();
  const shanghaiOffset = 8 * 60 * 60 * 1000;
  const shanghaiDate = new Date(now.getTime() + shanghaiOffset);
  const todayStart = new Date(shanghaiDate.getFullYear(), shanghaiDate.getMonth(), shanghaiDate.getDate());
  const todayStartUTC = new Date(todayStart.getTime() - shanghaiOffset);

  const usageRes = await query(
    `SELECT COALESCE(SUM(ul.total_tokens), 0) as used
     FROM usage_logs ul
     JOIN custom_models cm ON ul.model = cm.name
     WHERE ul.user_id = $1
       AND cm.is_free = true
       AND ul.created_at >= $2`,
    [userId, todayStartUTC.toISOString()]
  );
  const used = Number(usageRes.rows[0].used);

  // Get free models count
  const modelsRes = await query(
    `SELECT COUNT(*) as count FROM custom_models WHERE is_free = true AND is_active = true`
  );
  const freeModels = Number(modelsRes.rows[0].count);

  return NextResponse.json({
    eligible,
    totalTopup,
    used,
    limit: FREE_TOKEN_LIMIT,
    remaining: Math.max(0, FREE_TOKEN_LIMIT - used),
    percentage: Math.min(100, Math.round((used / FREE_TOKEN_LIMIT) * 100)),
    freeModels,
    resetAt: todayStartUTC.toISOString(),
  });
}
