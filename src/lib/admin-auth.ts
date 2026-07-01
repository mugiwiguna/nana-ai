import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if ((session.user as any).role !== "admin") return null;
  return session;
}
