import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Logg inn" }, { status: 401 });
  const chores = await pool.query("SELECT * FROM chores WHERE user_id = $1 ORDER BY id DESC", [user.id]);
  return NextResponse.json({ user, chores: chores.rows });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Logg inn" }, { status: 401 });
  const body = await request.json();
  const result = await pool.query(
    "INSERT INTO chores (user_id, title, description, frequency, points) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [user.id, body.title, body.description ?? "", body.frequency ?? "Ukentlig", body.points ?? 1],
  );
  return NextResponse.json({ chore: result.rows[0] });
}
