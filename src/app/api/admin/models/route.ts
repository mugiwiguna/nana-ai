import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await query(
    "SELECT m.*, p.name as provider_name FROM custom_models m JOIN custom_providers p ON p.id = m.provider_id ORDER BY m.created_at DESC"
  );
  return NextResponse.json({ models: res.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { provider_id, name, upstream_model_name, input_price, output_price } = await req.json();
  if (!provider_id || !name || !upstream_model_name)
    return NextResponse.json({ error: "provider_id, name, upstream_model_name wajib" }, { status: 400 });

  try {
    const res = await query(
      "INSERT INTO custom_models (provider_id, name, upstream_model_name, input_price, output_price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [provider_id, name, upstream_model_name, input_price || 0, output_price || 0]
    );
    return NextResponse.json({ model: res.rows[0] });
  } catch (e: any) {
    if (e.code === "23505")
      return NextResponse.json({ error: "Nama model sudah dipakai" }, { status: 409 });
    throw e;
  }
}
