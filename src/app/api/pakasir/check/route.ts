import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

/**
 * Check topup status after redirect back from Pakasir.
 * GET ?id=TOPUP-XXXXXXXX
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("id");
  if (!paymentId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Check local DB first
  const topup = await query(
    "SELECT status, amount FROM topups WHERE payment_id = $1 AND user_id = $2",
    [paymentId, session.user.id]
  );
  if (topup.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (topup.rows[0].status === "success") {
    return NextResponse.json({ status: "success", amount: topup.rows[0].amount });
  }

  // If still pending, verify with Pakasir API
  const slug = process.env.PAKASIR_SLUG;
  const apiKey = process.env.PAKASIR_KEY;
  const idrAmount = Math.round(Number(topup.rows[0].amount) * 16000);

  try {
    const res = await fetch(
      `https://app.pakasir.com/api/transactiondetail?project=${slug}&amount=${idrAmount}&order_id=${paymentId}&api_key=${apiKey}`
    );
    const data = await res.json();

    if (data.status === "completed") {
      // Credit balance (idempotent — webhook may have already done this)
      await query("UPDATE topups SET status = 'success' WHERE payment_id = $1 AND status = 'pending'", [paymentId]);
      await query(
        "UPDATE users SET balance = balance + $1 WHERE id = $2 AND NOT EXISTS (SELECT 1 FROM topups WHERE payment_id = $3 AND status = 'success')",
        [topup.rows[0].amount, session.user.id, paymentId]
      );
      return NextResponse.json({ status: "success", amount: topup.rows[0].amount });
    }

    return NextResponse.json({ status: "pending" });
  } catch {
    return NextResponse.json({ status: topup.rows[0].status });
  }
}
