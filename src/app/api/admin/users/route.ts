import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// GET all users with their active plans + usage
export async function GET() {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = await query(`
    SELECT u.id, u.email, u.name, u.balance, u.status, u.created_at,
      (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id) as api_key_count,
      (SELECT COALESCE(SUM(cost),0) FROM usage_logs WHERE user_id = u.id) as total_usage,
      (SELECT json_build_object(
        'id', us.id,
        'plan_name', p.name,
        'plan_slug', p.slug,
        'status', us.status,
        'expires_at', us.expires_at,
        'payment_method', us.payment_method
      ) FROM user_subscriptions us
        JOIN plans p ON us.plan_id = p.id
        WHERE us.user_id = u.id AND us.status = 'active' AND us.expires_at > now()
        ORDER BY us.created_at DESC LIMIT 1
      ) as active_plan,
      (SELECT json_build_object(
        'daily_used', COALESCE(SUM(CASE WHEN ul.created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Makassar') AT TIME ZONE 'Asia/Makassar' THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0),
        'monthly_used', COALESCE(SUM(CASE WHEN ul.created_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Makassar') AT TIME ZONE 'Asia/Makassar' THEN ul.tokens_in + ul.tokens_out ELSE 0 END), 0)
      ) FROM usage_logs ul WHERE ul.user_id = u.id
      ) as token_usage
    FROM users u ORDER BY u.created_at DESC
  `);

  return NextResponse.json({ users: res.rows });
}
