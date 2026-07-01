import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// Generate short referral code
function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// GET — user's referral code, stats, history
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get or create referral code
  let codeRes = await query(
    `SELECT code FROM referral_codes WHERE user_id = $1`, [userId]
  );
  if (codeRes.rows.length === 0) {
    let code = genCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const exists = await query(`SELECT id FROM referral_codes WHERE code = $1`, [code]);
      if (exists.rows.length === 0) break;
      code = genCode();
      attempts++;
    }
    await query(
      `INSERT INTO referral_codes (user_id, code) VALUES ($1, $2)`,
      [userId, code]
    );
    codeRes = { rows: [{ code }] } as any;
  }

  // Get settings
  const settings = await query(`SELECT * FROM referral_settings WHERE id = 1`);

  // Get referral stats
  const referrals = await query(
    `SELECT r.*, 
      COALESCE(u.name, u.email) as referee_name,
      r.completed_at IS NOT NULL as is_completed
     FROM referrals r
     LEFT JOIN users u ON u.id = r.referee_id
     WHERE r.referrer_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );

  const stats = await query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN bonus_amount ELSE 0 END), 0) as total_earned
     FROM referrals WHERE referrer_id = $1`,
    [userId]
  );

  const maxPerUser = settings.rows[0]?.max_per_user || 50;
  const isActive = settings.rows[0]?.is_active ?? true;
  const bonusAmount = settings.rows[0]?.bonus_amount || 1;

  return NextResponse.json({
    code: codeRes.rows[0].code,
    shareUrl: `https://nana.mwcs.dev/signup?ref=${codeRes.rows[0].code}`,
    isActive,
    bonusAmount,
    maxPerUser,
    stats: {
      total: Number(stats.rows[0].total),
      completed: Number(stats.rows[0].completed),
      totalEarned: Number(stats.rows[0].total_earned),
      remaining: maxPerUser - Number(stats.rows[0].total),
    },
    referrals: referrals.rows,
  });
}
