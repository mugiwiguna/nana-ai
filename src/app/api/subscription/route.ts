import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await query(
    `SELECT us.*, p.name as plan_name, p.credits as plan_credits, p.duration_days
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > now()
     ORDER BY us.created_at DESC LIMIT 1`,
    [session.user.id]
  );

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
  });
}
