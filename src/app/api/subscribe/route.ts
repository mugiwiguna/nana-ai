import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan_id, payment_method } = await req.json();

  if (!plan_id || !payment_method) {
    return NextResponse.json({ error: "Missing plan_id or payment_method" }, { status: 400 });
  }

  if (!["balance", "qris"].includes(payment_method)) {
    return NextResponse.json({ error: "payment_method must be 'balance' or 'qris'" }, { status: 400 });
  }

  // Get plan
  const planRes = await query("SELECT * FROM plans WHERE id = $1 AND is_active = true", [plan_id]);
  const plan = planRes.rows[0];
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // Check existing active subscription
  const existingRes = await query(
    "SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > now()",
    [session.user.id]
  );
  if (existingRes.rows.length > 0) {
    return NextResponse.json({ error: "Already have active subscription" }, { status: 409 });
  }

  const paymentId = "SUB-" + uuidv4().slice(0, 8);

  if (payment_method === "balance") {
    // Deduct from balance
    const userRes = await query("SELECT balance FROM users WHERE id = $1", [session.user.id]);
    const userBalance = parseFloat(userRes.rows[0].balance);

    if (userBalance < parseFloat(plan.price)) {
      return NextResponse.json({ error: "Insufficient balance", required: plan.price, available: userBalance }, { status: 402 });
    }

    // Deduct and create subscription in transaction
    await query("BEGIN");
    try {
      await query("UPDATE users SET balance = balance - $1 WHERE id = $2", [plan.price, session.user.id]);
      await query(
        `INSERT INTO user_subscriptions (user_id, plan_id, starts_at, expires_at, status, payment_method, payment_id)
         VALUES ($1, $2, now(), now() + interval '${plan.duration_days} days', 'active', 'balance', $3)`,
        [session.user.id, plan_id, paymentId]
      );
      await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [plan.credits, session.user.id]);
      await query("COMMIT");
    } catch (e) {
      await query("ROLLBACK");
      throw e;
    }

    return NextResponse.json({
      payment_id: paymentId,
      status: "active",
      plan: plan.name,
      credits_added: plan.credits,
      message: `Plan ${plan.name} activated! ${plan.credits} credits added.`,
    });
  }

  if (payment_method === "qris") {
    // Create pending subscription, return QRIS payment info
    // In production: integrate with Midtrans/Xendit for QRIS
    await query(
      `INSERT INTO user_subscriptions (user_id, plan_id, starts_at, expires_at, status, payment_method, payment_id)
       VALUES ($1, $2, now(), now() + interval '${plan.duration_days} days', 'pending', 'qris', $3)`,
      [session.user.id, plan_id, paymentId]
    );

    return NextResponse.json({
      payment_id: paymentId,
      status: "pending",
      plan: plan.name,
      amount: plan.price,
      message: "Scan QRIS to complete payment. Subscription activates after payment confirmed.",
      // TODO: replace with real QRIS URL from payment gateway
      qris_url: null,
    });
  }
}
