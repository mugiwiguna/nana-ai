import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_ids } = await req.json();
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array required" }, { status: 400 });
  }

  // Set usage_reset_at = now() for all active subscriptions of selected users
  const placeholders = user_ids.map((_: string, i: number) => `$${i + 1}`).join(",");
  const result = await query(
    `UPDATE user_subscriptions 
     SET usage_reset_at = now() 
     WHERE user_id IN (${placeholders}) 
     AND status = 'active' 
     AND expires_at > now()
     RETURNING user_id`,
    user_ids
  );

  return NextResponse.json({ 
    reset: result.rowCount,
    message: `Reset limit berhasil untuk ${result.rowCount} subscription aktif.`
  });
}
