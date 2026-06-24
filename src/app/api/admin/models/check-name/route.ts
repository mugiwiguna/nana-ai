import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  if (!name) return NextResponse.json({ available: false });

  const res = await query("SELECT id FROM custom_models WHERE name = $1", [name]);
  return NextResponse.json({ available: res.rows.length === 0 });
}
