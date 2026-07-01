import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = await query(
    "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100"
  );
  return NextResponse.json({ notifications: res.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, message, type, target, target_user_id } = await req.json();
  if (!title || !message)
    return NextResponse.json({ error: "title & message wajib" }, { status: 400 });

  const res = await query(
    `INSERT INTO notifications (title, message, type, target, target_user_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, message, type || "info", target || "all", target_user_id || null, session.user.id]
  );
  return NextResponse.json({ notification: res.rows[0] });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  await query("DELETE FROM notifications WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
