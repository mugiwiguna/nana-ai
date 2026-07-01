import { query } from "@/lib/db";

type NotifType = "info" | "warning" | "success" | "error";

/**
 * Create notification for a specific user.
 */
export async function notify(opts: {
  userId: string;
  title: string;
  message: string;
  type?: NotifType;
}) {
  await query(
    `INSERT INTO notifications (title, message, type, target, target_user_id)
     VALUES ($1, $2, $3, 'user', $4)`,
    [opts.title, opts.message, opts.type || "info", opts.userId]
  );
}

/**
 * Create notification for all users (blast).
 */
export async function notifyAll(opts: {
  title: string;
  message: string;
  type?: NotifType;
}) {
  await query(
    `INSERT INTO notifications (title, message, type, target, target_user_id)
     SELECT $1, $2, $3, 'all', u.id FROM users u WHERE u.role != 'admin'`,
    [opts.title, opts.message, opts.type || "info"]
  );
}
