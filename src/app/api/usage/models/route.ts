import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const dateClause = from && to ? "AND ul.created_at >= $2 AND ul.created_at <= $3" : "";
  const params: any[] = from && to ? [session.user.id, from, to] : [session.user.id];

  const res = await query(
    `SELECT ul.model,
            COUNT(*) as requests,
            COALESCE(SUM(ul.tokens_in + ul.tokens_out), 0) as tokens,
            COALESCE(SUM(ul.cost), 0) as cost,
            COALESCE(cm.is_free, false) as is_free
     FROM usage_logs ul
     LEFT JOIN custom_models cm ON ul.model = cm.name
     WHERE ul.user_id = $1 ${dateClause}
     GROUP BY ul.model, cm.is_free
     ORDER BY cost DESC`,
    params
  );

  return NextResponse.json({ models: res.rows });
}
