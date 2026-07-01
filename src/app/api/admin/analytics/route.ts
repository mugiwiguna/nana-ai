import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(Number(searchParams.get("days")) || 30, 90);

  // Daily usage stats
  const dailyUsage = await query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as request_count,
      SUM(tokens_in + tokens_out) as total_tokens,
      SUM(cost) as total_cost,
      COUNT(DISTINCT user_id) as unique_users
    FROM usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Top users by usage
  const topUsers = await query(`
    SELECT
      u.email,
      u.name,
      COUNT(*) as requests,
      SUM(ul.tokens_in + ul.tokens_out) as tokens,
      SUM(ul.cost) as cost
    FROM usage_logs ul
    JOIN users u ON u.id = ul.user_id
    WHERE ul.created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY u.id, u.email, u.name
    ORDER BY tokens DESC
    LIMIT 10
  `);

  // Model usage breakdown
  const modelUsage = await query(`
    SELECT
      model,
      COUNT(*) as requests,
      SUM(tokens_in + tokens_out) as tokens,
      SUM(cost) as cost
    FROM usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY model
    ORDER BY tokens DESC
    LIMIT 10
  `);

  // Summary
  const summary = await query(`
    SELECT
      COUNT(*) as total_requests,
      SUM(tokens_in + tokens_out) as total_tokens,
      SUM(cost) as total_cost,
      COUNT(DISTINCT user_id) as total_users
    FROM usage_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
  `);

  return NextResponse.json({
    days,
    summary: summary.rows[0],
    dailyUsage: dailyUsage.rows,
    topUsers: topUsers.rows,
    modelUsage: modelUsage.rows,
  });
}
