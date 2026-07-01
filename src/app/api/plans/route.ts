import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const res = await query(
    "SELECT id, name, slug, price, credits, duration_days, features, is_popular, is_active, description, daily_token_limit, weekly_token_limit, monthly_token_limit FROM plans ORDER BY price ASC"
  );
  return NextResponse.json(res.rows);
}
