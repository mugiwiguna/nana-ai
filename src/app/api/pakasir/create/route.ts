import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount < 1) return NextResponse.json({ error: "Minimal $1" }, { status: 400 });

  const userId = session.user.id;
  const paymentId = "TOPUP-" + uuidv4().slice(0, 8).toUpperCase();
  const idrAmount = Math.round(amount * 16000); // ponytail: hardcoded rate, pass from client

  await query(
    "INSERT INTO topups (user_id, amount, status, payment_id) VALUES ($1, $2, 'pending', $3)",
    [userId, amount, paymentId]
  );

  const slug = process.env.PAKASIR_SLUG;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3002";
  const redirectUrl = `${baseUrl}/dashboard/topup?check=${paymentId}`;

  // Pakasir URL: https://app.pakasir.com/pay/{project}/{amount}?order_id={}&redirect={}
  const paymentUrl = `https://app.pakasir.com/pay/${slug}/${idrAmount}?order_id=${paymentId}&redirect=${encodeURIComponent(redirectUrl)}`;

  return NextResponse.json({ payment_url: paymentUrl, payment_id: paymentId, idr_amount: idrAmount });
}
