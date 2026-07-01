import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// Blast: create notification for ALL users
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, message, type } = await req.json();
  if (!title || !message)
    return NextResponse.json({ error: "title & message wajib" }, { status: 400 });

  // Get all non-admin users
  const usersRes = await query(
    "SELECT id FROM users WHERE role != 'admin' AND status = 'active'"
  );

  // Insert one notification per user
  const values: string[] = [];
  const params: any[] = [];
  let i = 1;
  for (const u of usersRes.rows) {
    values.push(`($${i}, $${i+1}, $${i+2}, 'user', $${i+3}, $${i+4})`);
    params.push(title, message, type || "info", u.id, session.user.id);
    i += 5;
  }

  if (values.length === 0)
    return NextResponse.json({ success: true, count: 0 });

  // ponytail: batch insert; for >10k users switch to COPY or chunk
  await query(
    `INSERT INTO notifications (title, message, type, target, target_user_id, created_by)
     VALUES ${values.join(", ")}`,
    params
  );

  return NextResponse.json({ success: true, count: usersRes.rows.length });
}
