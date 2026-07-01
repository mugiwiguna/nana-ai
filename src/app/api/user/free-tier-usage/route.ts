import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkFreeTierUsage } from "@/lib/billing";

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

    const modelsRes = await query(
      `SELECT COUNT(*) as count FROM custom_models WHERE is_free = true AND is_active = true`
    );
    const freeModels = Number(modelsRes.rows[0].count);

    // Get free tier limits (daily/weekly/monthly)
    const freeTierLimits = await checkFreeTierUsage(userId);
    const dl = freeTierLimits.limits.daily;
    const wl = freeTierLimits.limits.weekly;
    const ml = freeTierLimits.limits.monthly;

    const addPct = (l: any) => ({ ...l, percentage: l.limit ? Math.min(100, Math.round((l.used / l.limit) * 100)) : 0 });

    return NextResponse.json({
      eligible,
      totalTopup,
      freeModels,
      // Flat structure (backward compat)
      used: dl.used,
      limit: dl.limit,
      remaining: dl.remaining,
      percentage: dl.limit ? Math.min(100, Math.round((dl.used / dl.limit) * 100)) : 0,
      // Nested structure with percentage
      daily: addPct(dl),
      weekly: addPct(wl),
      monthly: addPct(ml),
      allowed: freeTierLimits.allowed,
    });
  } catch (e: any) {
    console.error("free-tier-usage error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
