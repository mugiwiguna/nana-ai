import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/cron/check-subscription-expiry
// Run daily via cron or external scheduler
// Checks for subscriptions expiring in 1-7 days and sends notification
export async function GET() {
  // Find subscriptions expiring within 1-7 days that haven't been notified
  const res = await query(`
    SELECT us.id, us.user_id, us.expires_at, p.name as plan_name,
      u.email, u.name as user_name
    FROM user_subscriptions us
    JOIN plans p ON p.id = us.plan_id
    JOIN users u ON u.id = us.user_id
    WHERE us.status = 'active'
      AND us.expires_at > now()
      AND us.expires_at <= now() + interval '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.target_user_id = us.user_id
          AND n.title LIKE '%Paket%'
          AND n.created_at > now() - interval '24 hours'
      )
  `);

  let count = 0;
  for (const sub of res.rows) {
    const daysLeft = Math.ceil(
      (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const urgency = daysLeft <= 1 ? "segera" : daysLeft <= 3 ? "dalam 3 hari" : `${daysLeft} hari lagi`;

    await query(
      `INSERT INTO notifications (title, message, type, target, target_user_id)
       VALUES ($1, $2, 'warning', 'user', $3)`,
      [
        `⚠️ Paket ${sub.plan_name} akan habis!`,
        `Paket ${sub.plan_name} Anda ${urgency}. Perpanjang sekarang agar tidak terputus dari layanan.`,
        sub.user_id,
      ]
    );
    count++;
  }

  return NextResponse.json({ success: true, checked: res.rows.length, notified: count });
}
