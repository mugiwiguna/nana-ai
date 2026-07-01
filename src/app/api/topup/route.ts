import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const userId = session.user.id;
  const paymentId = "PAY-" + uuidv4().slice(0, 8);

  await query(
    "INSERT INTO topups (user_id, amount, status, payment_id) VALUES ($1, $2, 'pending', $3)",
    [userId, amount, paymentId]
  );

  // Mock payment — auto-approve
  await query("UPDATE topups SET status = 'success' WHERE payment_id = $1", [paymentId]);
  await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, userId]);

  // Referral bonus: if user was referred and this is their first successful topup ≥ $1
  if (amount >= 1) {
    const topupCount = await query(
      `SELECT COUNT(*) as cnt FROM topups WHERE user_id = $1 AND status = 'success'`,
      [userId]
    );
    const isFirstTopup = Number(topupCount.rows[0].cnt) === 1;

    if (isFirstTopup) {
      // Check if user was referred and referral is still pending
      const refRes = await query(
        `SELECT r.id, r.referrer_id, r.bonus_amount, rs.is_active
         FROM referrals r
         JOIN referral_settings rs ON rs.id = 1
         WHERE r.referee_id = $1 AND r.status = 'pending'`,
        [userId]
      );

      if (refRes.rows.length > 0 && refRes.rows[0].is_active) {
        const ref = refRes.rows[0];
        const bonus = Number(ref.bonus_amount);

        // Credit bonus to both referrer and referee
        await query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [bonus, ref.referrer_id]);
        await query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [bonus, userId]);

        // Update referral code uses
        const userRef = await query(`SELECT referred_by FROM users WHERE id = $1`, [userId]);
        if (userRef.rows[0]?.referred_by) {
          await query(
            `UPDATE referral_codes SET uses = uses + 1 WHERE user_id = $1`,
            [userRef.rows[0].referred_by]
          );
        }

        // Mark referral as completed
        await query(
          `UPDATE referrals SET status = 'completed', completed_at = now() WHERE id = $1`,
          [ref.id]
        );

        // Notify both
        await notify({
          userId: ref.referrer_id,
          title: "🎉 Referral bonus!",
          message: `Temanmu telah topup! Kamu mendapat $${bonus} bonus referral.`,
          type: "success",
        });
        await notify({
          userId,
          title: "🎉 Referral bonus!",
          message: `Selamat! Kamu mendapat $${bonus} bonus referral. Temanmu juga mendapat bonus yang sama.`,
          type: "success",
        });
      }
    }
  }

  return NextResponse.json({
    payment_id: paymentId,
    status: "success",
    amount,
    message: "Top-up berhasil (mock payment)",
  });
}
