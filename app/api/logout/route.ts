import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  if (sessionId) await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", "session=; Path=/; Max-Age=0");
  return response;
}
