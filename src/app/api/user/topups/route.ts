import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await query(
    "SELECT id, amount, status, payment_id, created_at FROM topups WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [session.user.id]
  );

  return NextResponse.json({ topups: res.rows });
}
