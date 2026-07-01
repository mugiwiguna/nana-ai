import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await query("SELECT * FROM plans ORDER BY price ASC");
  return NextResponse.json({ plans: res.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, price, credits, duration_days, description, features, model_ids, daily_token_limit, weekly_token_limit, monthly_token_limit, is_popular, is_active } = await req.json();
  if (!name || !slug || price === undefined)
    return NextResponse.json({ error: "name, slug, price wajib" }, { status: 400 });

  try {
    const res = await query(
      `INSERT INTO plans (name, slug, price, credits, duration_days, description, features, model_ids, daily_token_limit, weekly_token_limit, monthly_token_limit, is_popular, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [name, slug, price, credits || 0, duration_days || 30, description || null, JSON.stringify(features || []), JSON.stringify(model_ids || []), daily_token_limit || null, weekly_token_limit || null, monthly_token_limit || null, is_popular || false, is_active !== false]
    );
    return NextResponse.json({ plan: res.rows[0] });
  } catch (e: any) {
    if (e.code === "23505")
      return NextResponse.json({ error: "Slug sudah dipakai" }, { status: 409 });
    throw e;
  }
}
