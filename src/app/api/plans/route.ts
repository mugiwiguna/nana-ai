import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const res = await query(
    "SELECT id, name, slug, price, credits, duration_days, features, is_popular FROM plans WHERE is_active = true ORDER BY price ASC"
  );
  return NextResponse.json(res.rows);
}
