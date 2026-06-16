import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await query("UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2", [
    id,
    session.user.id,
  ]);

  return NextResponse.json({ success: true });
}
