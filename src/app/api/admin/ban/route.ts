import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = await req.json();
  if (!userId || !["ban", "suspend", "active"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const statusMap: Record<string, string> = { ban: "banned", suspend: "suspended", active: "active" };

  await query("UPDATE users SET status = $1 WHERE id = $2", [statusMap[action], userId]);

  // Revoke all active API keys on ban or suspend
  if (action === "ban" || action === "suspend") {
    await query("UPDATE api_keys SET is_active = false WHERE user_id = $1 AND is_active = true", [userId]);
  }

  return NextResponse.json({ success: true, status: statusMap[action] });
}
