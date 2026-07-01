import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { notify } from "@/lib/notify";

// POST — apply referral code
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Kode referral diperlukan" }, { status: 400 });
  }

  // Check settings active
  const settings = await query(`SELECT * FROM referral_settings WHERE id = 1`);
  if (!settings.rows[0]?.is_active) {
    return NextResponse.json({ error: "Program referral sedang tidak aktif" }, { status: 400 });
  }

  // Check if user already has a referrer
  const userRes = await query(`SELECT referred_by FROM users WHERE id = $1`, [userId]);
  if (userRes.rows[0]?.referred_by) {
    return NextResponse.json({ error: "Kamu sudah menggunakan kode referral" }, { status: 400 });
  }

  // Find referral code
  const codeRes = await query(
    `SELECT rc.*, u.id as owner_id 
     FROM referral_codes rc 
     JOIN users u ON u.id = rc.user_id 
     WHERE rc.code = $1`,
    [code.toUpperCase().trim()]
  );
  if (codeRes.rows.length === 0) {
    return NextResponse.json({ error: "Kode referral tidak ditemukan" }, { status: 404 });
  }

  const referralCode = codeRes.rows[0];

  // Can't refer yourself
  if (referralCode.owner_id === userId) {
    return NextResponse.json({ error: "Tidak bisa pakai kode referral sendiri" }, { status: 400 });
  }

  // Check max uses
  const maxPerUser = settings.rows[0]?.max_per_user || 50;
  if (referralCode.uses >= maxPerUser) {
    return NextResponse.json({ error: "Kode referral sudah mencapai batas maksimal" }, { status: 400 });
  }

  // Check if already used this code
  const existingRef = await query(
    `SELECT id FROM referrals WHERE referee_id = $1 AND code = $2`,
    [userId, code.toUpperCase().trim()]
  );
  if (existingRef.rows.length > 0) {
    return NextResponse.json({ error: "Kode referral sudah digunakan" }, { status: 400 });
  }

  // Apply referral — mark user as referred, create pending record
  await query(`UPDATE users SET referred_by = $1 WHERE id = $2`, [referralCode.owner_id, userId]);
  await query(
    `INSERT INTO referrals (referrer_id, referee_id, code, status, bonus_amount)
     VALUES ($1, $2, $3, 'pending', $4)`,
    [referralCode.owner_id, userId, code.toUpperCase().trim(), settings.rows[0]?.bonus_amount || 1]
  );

  return NextResponse.json({
    success: true,
    message: `Kode referral berhasil diterapkan! Topup minimal $1 untuk bonus $${settings.rows[0]?.bonus_amount || 1} untuk kamu dan temanmu.`,
  });
}
