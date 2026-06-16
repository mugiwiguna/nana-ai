import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 500);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const [dataRes, countRes] = await Promise.all([
    query(
      "SELECT id, model, tokens_in, tokens_out, cost, created_at FROM usage_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [session.user.id, limit, offset]
    ),
    query("SELECT COUNT(*) as total FROM usage_logs WHERE user_id = $1", [session.user.id]),
  ]);

  return NextResponse.json({
    usage: dataRes.rows,
    total: parseInt(countRes.rows[0].total),
  });
}
