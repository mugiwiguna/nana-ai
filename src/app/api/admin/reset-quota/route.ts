import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nana.mwcs.dev") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount = 5 } = await req.json();

  if (userId === "all") {
    await query("UPDATE users SET balance = $1 WHERE email != 'admin@nana.mwcs.dev'", [amount]);
    return NextResponse.json({ success: true, message: "All users quota reset to $" + amount });
  }

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await query("UPDATE users SET balance = $1 WHERE id = $2", [amount, userId]);
  return NextResponse.json({ success: true, message: "Quota reset to $" + amount });
}
