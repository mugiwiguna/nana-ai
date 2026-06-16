import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userStatus = await query("SELECT status FROM users WHERE id = $1", [session.user.id]);
  if (userStatus.rows[0]?.status !== "active") {
    return NextResponse.json({ error: "Account banned or suspended" }, { status: 403 });
  }

  const { keyId } = await req.json();
  if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

  const keyRes = await query("SELECT name FROM api_keys WHERE id = $1 AND user_id = $2", [keyId, session.user.id]);
  if (!keyRes.rows[0]) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const name = keyRes.rows[0].name;

  // Revoke old key
  await query("UPDATE api_keys SET is_active = false WHERE id = $1", [keyId]);

  // Create new key with same name
  const newKey = "sk-nana-" + uuidv4().replace(/-/g, "");
  await query("INSERT INTO api_keys (user_id, key, name) VALUES ($1, $2, $3)", [
    session.user.id,
    newKey,
    name,
  ]);

  return NextResponse.json({ key: newKey, name }, { status: 201 });
}
