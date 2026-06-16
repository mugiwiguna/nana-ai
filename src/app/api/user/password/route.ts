import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const userRes = await query("SELECT password_hash, google_id FROM users WHERE id = $1", [session.user.id]);
  const user = userRes.rows[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.google_id) {
    return NextResponse.json({ error: "Akun Google tidak bisa ganti password" }, { status: 400 });
  }

  if (!user.password_hash) {
    return NextResponse.json({ error: "Akun tidak memiliki password" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, session.user.id]);

  return NextResponse.json({ success: true, message: "Password berhasil diubah" });
}
