import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const total = await query("SELECT COUNT(*) as c FROM api_keys WHERE user_id = $1", [session.user.id]);
  const active = await query("SELECT COUNT(*) as c FROM api_keys WHERE user_id = $1 AND is_active = true", [session.user.id]);
  const usage = await query(
    "SELECT COALESCE(SUM(cost),0) as total_cost, COALESCE(SUM(tokens_in + tokens_out),0) as total_tokens FROM usage_logs WHERE user_id = $1",
    [session.user.id]
  );

  return NextResponse.json({
    total: parseInt(total.rows[0].c),
    active: parseInt(active.rows[0].c),
    totalCost: Number(usage.rows[0].total_cost),
    totalTokens: parseInt(usage.rows[0].total_tokens),
  });
}
