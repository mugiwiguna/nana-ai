import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await query("SELECT * FROM headlines ORDER BY created_at DESC");
  return NextResponse.json({ headlines: res.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, type, link_url, link_text, is_active, starts_at, ends_at } = await req.json();
  if (!title) return NextResponse.json({ error: "title wajib" }, { status: 400 });

  const res = await query(
    `INSERT INTO headlines (title, content, type, link_url, link_text, is_active, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, content || null, type || "info", link_url || null, link_text || null, is_active !== false, starts_at || null, ends_at || null]
  );
  return NextResponse.json({ headline: res.rows[0] });
}
