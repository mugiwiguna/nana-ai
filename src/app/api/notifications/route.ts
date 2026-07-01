import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// User: get own notifications
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await query(
    `SELECT id, title, message, type, is_read, created_at
     FROM notifications
     WHERE target_user_id = $1 OR target = 'all'
     ORDER BY created_at DESC
     LIMIT 50`,
    [session.user.id]
  );

  const unreadRes = await query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE (target_user_id = $1 OR target = 'all') AND is_read = false`,
    [session.user.id]
  );

  return NextResponse.json({
    notifications: res.rows,
    unread: Number(unreadRes.rows[0].count),
  });
}

// User: mark as read
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  await query(
    "UPDATE notifications SET is_read = true WHERE id = $1 AND (target_user_id = $2 OR target = 'all')",
    [id, session.user.id]
  );
  return NextResponse.json({ success: true });
}
