import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(
      `SELECT cm.id, cm.name, cm.upstream_model_name, cm.input_price, cm.output_price,
              cp.name AS provider_name, cp.slug AS provider_slug, cm.is_free
       FROM custom_models cm
       JOIN custom_providers cp ON cp.id = cm.provider_id
       WHERE cm.is_active = true AND cp.is_active = true
       ORDER BY cm.created_at DESC`
    );
    return NextResponse.json({ models: res.rows });
  } catch (e) {
    console.error("custom-models err:", e);
    return NextResponse.json({ models: [] });
  }
}
