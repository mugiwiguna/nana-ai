import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await query(
    `SELECT DATE(created_at) as day,
            COUNT(*) as requests,
            COALESCE(SUM(tokens_in + tokens_out), 0) as tokens,
            COALESCE(SUM(cost), 0) as cost
     FROM usage_logs
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [session.user.id]
  );

  return NextResponse.json({ days: res.rows });
}
