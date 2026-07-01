import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { notify } from "@/lib/notify";

/**
 * Pakasir webhook — POST body:
 * { amount, order_id, project, status, payment_method, completed_at }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, status, amount } = body;

    console.log("[Pakasir Webhook]", body);

    if (!order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

    // Verify topup exists and is pending
    const topup = await query(
      "SELECT * FROM topups WHERE payment_id = $1 AND status = 'pending'",
      [order_id]
    );
    if (topup.rows.length === 0) {
      // Already processed or doesn't exist
      return NextResponse.json({ ok: true, message: "Already processed or not found" });
    }

    const t = topup.rows[0];

    if (status === "completed") {
      // Credit balance
      await query("UPDATE topups SET status = 'success' WHERE payment_id = $1", [order_id]);
      await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [t.amount, t.user_id]);

      // Referral bonus logic (same as existing topup)
      if (Number(t.amount) >= 1) {
        const topupCount = await query(
          "SELECT COUNT(*) as cnt FROM topups WHERE user_id = $1 AND status = 'success'",
          [t.user_id]
        );
        if (Number(topupCount.rows[0].cnt) === 1) {
          const refRes = await query(
            `SELECT r.id, r.referrer_id, r.bonus_amount, rs.is_active
             FROM referrals r JOIN referral_settings rs ON rs.id = 1
             WHERE r.referee_id = $1 AND r.status = 'pending'`,
            [t.user_id]
          );
          if (refRes.rows.length > 0 && refRes.rows[0].is_active) {
            const ref = refRes.rows[0];
            const bonus = Number(ref.bonus_amount);
            await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [bonus, ref.referrer_id]);
            await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [bonus, t.user_id]);
            const userRef = await query("SELECT referred_by FROM users WHERE id = $1", [t.user_id]);
            if (userRef.rows[0]?.referred_by) {
              await query("UPDATE referral_codes SET uses = uses + 1 WHERE user_id = $1", [userRef.rows[0].referred_by]);
            }
            await query("UPDATE referrals SET status = 'completed', completed_at = now() WHERE id = $1", [ref.id]);
            await notify({ userId: ref.referrer_id, title: "🎉 Referral bonus!", message: `Temanmu telah topup! +$${bonus}`, type: "success" });
            await notify({ userId: t.user_id, title: "🎉 Referral bonus!", message: `+$${bonus} referral bonus!`, type: "success" });
          }
        }
      }

      await notify({ userId: t.user_id, title: "💰 Topup berhasil!", message: `+$${t.amount} ditambahkan ke saldo.`, type: "success" });
    } else {
      // Payment failed/cancelled
      await query("UPDATE topups SET status = 'failed' WHERE payment_id = $1", [order_id]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Pakasir Webhook Error]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
