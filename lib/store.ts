import "server-only";
import { db, pool } from "./db";
import { hashPassword } from "./auth";
import { people, seed, suggestions } from "./house";

export { db };

let ready: Promise<void> | undefined;
export async function initialize() {
  const sql = db();
  if (!ready) {
    // Add missing standard tasks only. Existing points and selections stay unchanged.
    const tasks = [
      ...seed.map((t) => ({ ...t, active: 1 })),
      ...suggestions.map((t) => ({ ...t, active: 0 })),
    ];
    ready = (async () => {
      const client = await pool().connect();
      try {
        await client.query("BEGIN");
        for (const t of tasks)
          await client.query(
            "INSERT INTO tasks (id, name, frequency, points, dog, active) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
            [t.id, t.name, t.frequency, t.points, t.dog, t.active],
          );
        // Create one login per person on first start. Existing passwords stay unchanged.
        const initial = process.env.INITIAL_PASSWORD;
        if (initial)
          for (let i = 0; i < people.length; i++)
            await client.query(
              "INSERT INTO users (username, password_hash, person) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
              [people[i].toLowerCase(), hashPassword(initial), i],
            );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      ready = undefined;
      throw error;
    });
  }
  await ready;
  return sql;
}
