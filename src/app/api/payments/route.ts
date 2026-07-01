import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await query(`SELECT id FROM users WHERE email = $1`, [session.user.email]);
  if (!user.rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const payments = await query(`
    SELECT id, plan_name, amount, currency, payment_method, status, created_at
    FROM payment_history
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [user.rows[0].id]);

  return NextResponse.json(payments.rows);
}
