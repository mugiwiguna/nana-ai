import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await query("SELECT id, name, key, is_active, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC", [session.user.id]);
  return NextResponse.json({ keys: res.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userStatus = await query("SELECT status FROM users WHERE id = $1", [session.user.id]);
  if (userStatus.rows[0]?.status !== "active") {
    return NextResponse.json({ error: "Account is banned or suspended. Cannot generate API keys." }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const key = "sk-nana-" + uuidv4().replace(/-/g, "");
  await query("INSERT INTO api_keys (user_id, key, name) VALUES ($1, $2, $3)", [
    session.user.id,
    key,
    name,
  ]);

  return NextResponse.json({ key, name }, { status: 201 });
}
