import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Public: get active headlines for dashboard
export async function GET() {
  const res = await query(
    `SELECT id, title, content, type, link_url, link_text, starts_at, ends_at
     FROM headlines
     WHERE is_active = true
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at >= now())
     ORDER BY created_at DESC
     LIMIT 5`
  );
  return NextResponse.json({ headlines: res.rows });
}
