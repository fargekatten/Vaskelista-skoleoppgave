import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await pool.query(
    "SELECT id, username FROM users WHERE username = $1 AND password = $2",
    [body.username, body.password],
  );
  if (!result.rows[0]) return NextResponse.json({ error: "Feil brukernavn eller passord" }, { status: 401 });
  const sessionId = randomUUID();
  await pool.query("INSERT INTO sessions (id, user_id) VALUES ($1, $2)", [sessionId, result.rows[0].id]);
  const response = NextResponse.json({ user: result.rows[0] });
  response.headers.append("Set-Cookie", `session=${sessionId}; Path=/; Max-Age=604800`);
  return response;
}
