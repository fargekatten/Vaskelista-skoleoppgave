import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { pool } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Logg inn" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();
  const result = await pool.query(
    "UPDATE chores SET title = $1, description = $2, frequency = $3, points = $4, completed = $5 WHERE id = $6 AND user_id = $7 RETURNING *",
    [body.title, body.description ?? "", body.frequency ?? "Ukentlig", body.points ?? 1, body.completed ?? false, id, user.id],
  );
  if (!result.rows[0]) return NextResponse.json({ error: "Fant ikke oppgaven" }, { status: 404 });
  return NextResponse.json({ chore: result.rows[0] });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Logg inn" }, { status: 401 });
  const { id } = await context.params;
  await pool.query("DELETE FROM chores WHERE id = $1 AND user_id = $2", [id, user.id]);
  return NextResponse.json({ ok: true });
}
