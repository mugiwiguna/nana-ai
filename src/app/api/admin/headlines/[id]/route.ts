import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const sets: string[] = [];
  const vals: any[] = [];
  let i = 1;

  for (const [k, v] of Object.entries(body)) {
    if (["title", "content", "type", "link_url", "link_text", "is_active", "starts_at", "ends_at"].includes(k)) {
      sets.push(`${k} = $${i}`);
      vals.push(v);
      i++;
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  vals.push(id);
  await query(`UPDATE headlines SET ${sets.join(", ")} WHERE id = $${i}`, vals);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await query("DELETE FROM headlines WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
