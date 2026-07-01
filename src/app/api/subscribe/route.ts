import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 5 purchases per hour
  const rl = checkRateLimit(`subscribe:${session.user.id}`, 5, 3600000);
  if (!rl.ok) return NextResponse.json({ error: `Terlalu cepat. Coba lagi dalam ${rl.retryAfter}s` }, { status: 429 });

  const { plan_id, payment_method } = await req.json();

  if (!plan_id || !payment_method) {
    return NextResponse.json({ error: "Missing plan_id or payment_method" }, { status: 400 });
  }

  if (!["balance", "qris"].includes(payment_method)) {
    return NextResponse.json({ error: "payment_method must be 'balance' or 'qris'" }, { status: 400 });
  }

  // Get target plan
  const planRes = await query("SELECT * FROM plans WHERE id = $1 AND is_active = true", [plan_id]);
  const plan = planRes.rows[0];
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // Check existing active subscription
  const existingRes = await query(
    `SELECT us.*, p.price as plan_price, p.slug as plan_slug, p.duration_days
     FROM user_subscriptions us
     JOIN plans p ON us.plan_id = p.id
     WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > now()
     ORDER BY us.created_at DESC LIMIT 1`,
    [session.user.id]
  );
  const existing = existingRes.rows[0];

  if (existing) {
    const existingPrice = parseFloat(existing.plan_price);
    const newPrice = parseFloat(plan.price);

    // Can't downgrade while active
    if (newPrice < existingPrice) {
      return NextResponse.json({
        error: `Tidak bisa downgrade. Plan aktif: ${existing.plan_slug}. Tunggu sampai expired atau hubungi admin.`,
        current_plan: existing.plan_slug,
        expires_at: existing.expires_at,
      }, { status: 409 });
    }

    // Buyback same plan: extend duration + stack limits
    if (existing.plan_id === plan_id) {
      const paymentId = "SUB-" + uuidv4().slice(0, 8);

      if (payment_method === "balance") {
        const userRes = await query("SELECT balance FROM users WHERE id = $1", [session.user.id]);
        const userBalance = parseFloat(userRes.rows[0].balance);
        if (userBalance < newPrice) {
          return NextResponse.json({ error: "Insufficient balance", required: plan.price, available: userBalance }, { status: 402 });
        }

        await query("BEGIN");
        try {
          await query("UPDATE users SET balance = balance - $1 WHERE id = $2", [plan.price, session.user.id]);
          // Extend expiry from current expiry (or now if already expired)
          const baseExpiry = new Date(existing.expires_at) > new Date() ? existing.expires_at : new Date().toISOString();
          await query(
            `UPDATE user_subscriptions
             SET expires_at = $1::timestamp + interval '${plan.duration_days} days',
                 usage_reset_at = now()
             WHERE id = $2`,
            [baseExpiry, existing.id]
          );
          await query("COMMIT");
        } catch (e) {
          await query("ROLLBACK");
          throw e;
        }

        await query(`
          INSERT INTO payment_history (user_id, subscription_id, plan_name, amount, payment_method, status)
          VALUES ($1, $2, $3, $4, 'balance', 'completed')
        `, [session.user.id, existing.id, plan.name, plan.price]);

        return NextResponse.json({
          payment_id: paymentId,
          status: "active",
          plan: plan.name,
          buyback: true,
          message: `Buyback ${plan.name}! Durasi +${plan.duration_days} hari, limit direset.`,
        });
      }

      // QRIS buyback
      await query(
        `INSERT INTO user_subscriptions (user_id, plan_id, starts_at, expires_at, status, payment_method, payment_id, limit_multiplier)
         VALUES ($1, $2, now(), now(), 'pending', 'qris', $3, 1)`,
        [session.user.id, plan_id, paymentId]
      );
      return NextResponse.json({
        payment_id: paymentId,
        status: "pending",
        plan: plan.name,
        buyback: true,
        amount: plan.price,
        message: "Scan QRIS untuk buyback. Durasi +limit ditumpuk setelah pembayaran.",
        qris_url: null,
      });
    }

    // Upgrade to more expensive plan: cancel existing, create new
    if (newPrice >= existingPrice) {
      // Allowed — will cancel old and create new below
    }
  }

  // New purchase (no active plan, or upgrade)
  const paymentId = "SUB-" + uuidv4().slice(0, 8);

  if (payment_method === "balance") {
    const userRes = await query("SELECT balance FROM users WHERE id = $1", [session.user.id]);
    const userBalance = parseFloat(userRes.rows[0].balance);
    if (userBalance < parseFloat(plan.price)) {
      return NextResponse.json({ error: "Insufficient balance", required: plan.price, available: userBalance }, { status: 402 });
    }

    await query("BEGIN");
    try {
      await query("UPDATE users SET balance = balance - $1 WHERE id = $2", [plan.price, session.user.id]);
      // Cancel existing if upgrading
      if (existing) {
        await query("UPDATE user_subscriptions SET status = 'cancelled' WHERE id = $1", [existing.id]);
      }
      await query(
        `INSERT INTO user_subscriptions (user_id, plan_id, starts_at, expires_at, status, payment_method, payment_id)
         VALUES ($1, $2, now(), now() + interval '${plan.duration_days} days', 'active', 'balance', $3)`,
        [session.user.id, plan_id, paymentId]
      );
      await query("COMMIT");
    } catch (e) {
      await query("ROLLBACK");
      throw e;
    }

    await query(`
      INSERT INTO payment_history (user_id, subscription_id, plan_name, amount, payment_method, status)
      VALUES ($1, $2, $3, $4, 'balance', 'completed')
    `, [session.user.id, existing ? existing.id : null, plan.name, plan.price]);

    return NextResponse.json({
      payment_id: paymentId,
      status: "active",
      plan: plan.name,
      message: `Plan ${plan.name} activated!`,
    });
  }

  // QRIS new purchase
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
    message: "Scan QRIS to complete payment.",
    qris_url: null,
  });
}
