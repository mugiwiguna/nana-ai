import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

function dateFilter(url: URL) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from && to) return { clause: "AND ul.created_at >= $2 AND ul.created_at <= $3", params: [from, to] };
  return { clause: "", params: [] };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const { clause, params } = dateFilter(url);

  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT ul.id, ul.model, ul.api_key_id, ul.tokens_in, ul.tokens_out, ul.cost, ul.created_at, COALESCE(cm.is_free, false) as is_free FROM usage_logs ul LEFT JOIN custom_models cm ON ul.model = cm.name WHERE ul.user_id = $1 ${clause} ORDER BY ul.created_at DESC LIMIT $${params.length + 2} OFFSET $${params.length + 3}`,
      [session.user.id, ...params, limit, offset]
    ),
    query(
      `SELECT COUNT(*) as total FROM usage_logs WHERE user_id = $1 ${clause}`,
      [session.user.id, ...params]
    ),
  ]);

  return NextResponse.json({
    usage: dataRes.rows,
    total: parseInt(countRes.rows[0].total),
  });
}
