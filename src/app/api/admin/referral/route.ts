import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// GET — referral settings
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await query(`SELECT * FROM referral_settings WHERE id = 1`);
  const stats = await query(`
    SELECT 
      COUNT(*) as total_referrals,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN bonus_amount * 2 ELSE 0 END), 0) as total_bonus_paid
    FROM referrals
  `);

  return NextResponse.json({
    settings: settings.rows[0],
    stats: stats.rows[0],
  });
}

// PATCH — update referral settings
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ["is_active", "max_per_user", "bonus_amount"];
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = $${idx}`);
      values.push(body[key]);
      idx++;
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  sets.push(`updated_at = now()`);
  values.push(1); // id = 1

  await query(
    `UPDATE referral_settings SET ${sets.join(", ")} WHERE id = $${idx}`,
    values
  );

  return NextResponse.json({ success: true });
}
