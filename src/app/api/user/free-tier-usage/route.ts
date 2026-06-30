import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

const FREE_TOKEN_LIMIT = 3_000_000;
const MIN_TOPUP = 1; // $1

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
    const shanghaiOffset = 8 * 60 * 60 * 1000;
    const shanghaiDate = new Date(now.getTime() + shanghaiOffset);
    const todayStart = new Date(shanghaiDate.getFullYear(), shanghaiDate.getMonth(), shanghaiDate.getDate());
    const todayStartUTC = new Date(todayStart.getTime() - shanghaiOffset);

    let used = 0;
    try {
      const usageRes = await query(
        `SELECT COALESCE(SUM(ul.tokens_in + ul.tokens_out), 0) as used
         FROM usage_logs ul
         JOIN custom_models cm ON ul.model = cm.name
         WHERE ul.user_id = $1
           AND cm.is_free = true
           AND ul.created_at >= $2`,
        [userId, todayStartUTC.toISOString()]
      );
      used = Number(usageRes.rows[0].used);
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
      used,
      limit: FREE_TOKEN_LIMIT,
      remaining: Math.max(0, FREE_TOKEN_LIMIT - used),
      percentage: Math.min(100, Math.round((used / FREE_TOKEN_LIMIT) * 100)),
      freeModels,
      resetAt: todayStartUTC.toISOString(),
    });
  } catch (e: any) {
    console.error("free-tier-usage error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
