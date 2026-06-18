import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const dateClause = from && to ? "AND created_at >= $2 AND created_at <= $3" : "AND created_at > NOW() - INTERVAL '30 days'";
  const params: any[] = from && to ? [session.user.id, from, to] : [session.user.id];

  const res = await query(
    `SELECT DATE(created_at) as day, model,
            COUNT(*) as requests,
            COALESCE(SUM(tokens_in + tokens_out), 0) as tokens,
            COALESCE(SUM(cost), 0) as cost
     FROM usage_logs
     WHERE user_id = $1 ${dateClause}
     GROUP BY DATE(created_at), model
     ORDER BY day ASC`,
    params
  );

  return NextResponse.json({ days: res.rows });
}
