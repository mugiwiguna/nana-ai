import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== "admin@nana.mwcs.dev")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await query(
    "SELECT p.*, COALESCE(json_agg(json_build_object('id', m.id, 'name', m.name, 'upstream_model_name', m.upstream_model_name, 'is_active', m.is_active)) FILTER (WHERE m.id IS NOT NULL), '[]') as models FROM custom_providers p LEFT JOIN custom_models m ON m.provider_id = p.id GROUP BY p.id ORDER BY p.created_at DESC"
  );
  return NextResponse.json({ providers: res.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nana.mwcs.dev")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, base_url, api_key } = await req.json();
  if (!name || !slug || !base_url || !api_key)
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });

  try {
    const res = await query(
      "INSERT INTO custom_providers (name, slug, base_url, api_key) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, slug.toLowerCase(), base_url.replace(/\/$/, ""), api_key]
    );
    return NextResponse.json({ provider: res.rows[0] });
  } catch (e: any) {
    if (e.code === "23505")
      return NextResponse.json({ error: "Slug sudah dipakai" }, { status: 409 });
    throw e;
  }
}
