import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const res = await query(
    `SELECT t.id, t.amount, t.status, t.payment_id, t.created_at,
            u.email, u.name, u.balance
     FROM topups t JOIN users u ON t.user_id = u.id
     WHERE t.user_id = $1
     ORDER BY t.created_at DESC LIMIT $2`,
    [userId, limit]
  );

  return NextResponse.json({ topups: res.rows });
}
