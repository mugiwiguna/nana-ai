import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, balance } = await req.json();
  if (!userId || balance === undefined || balance < 0) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  await query("UPDATE users SET balance = $1 WHERE id = $2", [balance, userId]);
  return NextResponse.json({ success: true, balance });
}
