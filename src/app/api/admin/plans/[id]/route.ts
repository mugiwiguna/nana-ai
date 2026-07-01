import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "slug", "price", "credits", "duration_days", "description", "features", "model_ids", "daily_token_limit", "weekly_token_limit", "monthly_token_limit", "is_popular", "is_active"];
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) {
      const val = k === "features" || k === "model_ids" ? JSON.stringify(v) : v;
      sets.push(`${k} = $${i}`);
      vals.push(val);
      i++;
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  vals.push(id);
  await query(`UPDATE plans SET ${sets.join(", ")} WHERE id = $${i}`, vals);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.email !== "admin@nanaai.id")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  // Soft delete — just deactivate
  await query("UPDATE plans SET is_active = false WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
