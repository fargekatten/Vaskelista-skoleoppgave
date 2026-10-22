import "server-only";
import { neon } from "@neondatabase/serverless";
import { seed, suggestions } from "./house";

// This file runs only on the server. Never use NEXT_PUBLIC_DATABASE_URL.
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing");
  return neon(url);
}

let ready: Promise<void> | undefined;
export async function initialize() {
  const sql = db();
  if (!ready) {
    // Add missing standard tasks only. Existing points and selections stay unchanged.
    const tasks = [
      ...seed.map((t) => ({ ...t, active: 1 })),
      ...suggestions.map((t) => ({ ...t, active: 0 })),
    ];
    ready = sql
      .transaction(
        tasks.map(
          (t) => sql`
      INSERT INTO tasks (id, name, frequency, points, dog, active)
      VALUES (${t.id}, ${t.name}, ${t.frequency}, ${t.points}, ${t.dog}, ${t.active})
      ON CONFLICT (id) DO NOTHING
    `,
        ),
      )
      .then(() => {})
      .catch((error) => {
        ready = undefined;
        throw error;
      });
  }
  await ready;
  return sql;
}
