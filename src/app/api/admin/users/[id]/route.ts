import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// POST: assign plan to user manually
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const { plan_id } = await req.json();

  if (!plan_id) return NextResponse.json({ error: "Missing plan_id" }, { status: 400 });

  const planRes = await query("SELECT * FROM plans WHERE id = $1", [plan_id]);
  const plan = planRes.rows[0];
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const userRes = await query("SELECT id FROM users WHERE id = $1", [userId]);
  if (!userRes.rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Cancel existing active subscription
  await query(
    "UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
    [userId]
  );

  const paymentId = "ADMIN-" + uuidv4().slice(0, 8);

  const subRes = await query(
    `INSERT INTO user_subscriptions (user_id, plan_id, starts_at, expires_at, status, payment_method, payment_id)
     VALUES ($1, $2, now(), now() + interval '${plan.duration_days} days', 'active', 'admin', $3)
     RETURNING *`,
    [userId, plan_id, paymentId]
  );

  return NextResponse.json({ subscription: subRes.rows[0], plan: plan.name });
}

// DELETE: cancel user's active subscription
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  const res = await query(
    "UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active' RETURNING id",
    [userId]
  );

  return NextResponse.json({ cancelled: res.rowCount });
}
