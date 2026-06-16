import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount } = await req.json();
  if (!userId || amount === undefined || amount === null) {
    return NextResponse.json({ error: "userId and amount required" }, { status: 400 });
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Check resulting balance won't go negative
  if (amountNum < 0) {
    const userRes = await query("SELECT balance FROM users WHERE id = $1", [userId]);
    const current = Number(userRes.rows[0]?.balance || 0);
    if (current + amountNum < 0) {
      return NextResponse.json({ error: "Saldo tidak cukup untuk pengurangan" }, { status: 400 });
    }
  }

  await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amountNum, userId]);
  return NextResponse.json({ success: true, amount: amountNum });
}
