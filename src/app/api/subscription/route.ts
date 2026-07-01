import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { checkTokenLimits, checkFreeTierUsage } from "@/lib/billing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await query(
    `SELECT us.*, p.name as plan_name, p.credits as plan_credits, p.duration_days, p.daily_token_limit, p.weekly_token_limit, p.monthly_token_limit, COALESCE(us.limit_multiplier, 1) as limit_multiplier
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > now()
     ORDER BY us.created_at DESC LIMIT 1`,
    [session.user.id]
  );

  const [paidLimits, freeLimits] = await Promise.all([
    checkTokenLimits(session.user.id),
    checkFreeTierUsage(session.user.id),
  ]);

  const historyRes = await query(
    `SELECT us.*, p.name as plan_name, p.price
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1
     ORDER BY us.created_at DESC LIMIT 10`,
    [session.user.id]
  );

  return NextResponse.json({
    active: res.rows[0] || null,
    history: historyRes.rows,
    tokenLimits: paidLimits.limits,
    freeTierLimits: freeLimits.limits,
  });
}
