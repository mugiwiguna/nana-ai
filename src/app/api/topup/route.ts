import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const paymentId = "PAY-" + uuidv4().slice(0, 8);

  await query(
    "INSERT INTO topups (user_id, amount, status, payment_id) VALUES ($1, $2, 'pending', $3)",
    [session.user.id, amount, paymentId]
  );

  // Mock payment — auto-approve
  await query("UPDATE topups SET status = 'success' WHERE payment_id = $1", [paymentId]);
  await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, session.user.id]);

  return NextResponse.json({
    payment_id: paymentId,
    status: "success",
    amount,
    message: "Top-up berhasil (mock payment)",
  });
}
