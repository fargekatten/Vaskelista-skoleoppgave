import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export async function currentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (!sessionId) return null;
  const result = await pool.query(
    "SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = $1",
    [sessionId],
  );
  return result.rows[0] ?? null;
}
