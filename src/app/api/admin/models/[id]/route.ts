import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.email !== "admin@nana.mwcs.dev")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await query("DELETE FROM custom_models WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.email !== "admin@nana.mwcs.dev")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  for (const [k, v] of Object.entries(body)) {
    if (["provider_id", "name", "upstream_model_name", "input_price", "output_price", "is_active", "is_free"].includes(k)) {
      sets.push(`${k} = $${idx++}`);
      vals.push(v);
    }
  }

  if (!sets.length)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  sets.push(`updated_at = NOW()`);
  vals.push(id);

  const res = await query(
    `UPDATE custom_models SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    vals
  );
  return NextResponse.json({ model: res.rows[0] });
}
