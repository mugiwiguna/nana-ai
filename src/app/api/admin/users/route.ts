import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = await query(`
    SELECT u.id, u.email, u.name, u.balance, u.status, u.created_at,
      (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) as api_key_count,
      (SELECT COALESCE(SUM(cost),0) FROM usage_logs WHERE user_id = u.id) as total_usage
    FROM users u ORDER BY u.created_at DESC
  `);

  return NextResponse.json({ users: res.rows });
}
