import "server-only";
import { Pool } from "pg";

// This file runs only on the server. Never use NEXT_PUBLIC_DATABASE_URL.
// Works with the Docker database (host "db" on the internal Docker network) and with Neon.
const globalForPool = globalThis as unknown as { vaskelistaPool?: Pool };

export function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing");
  return (globalForPool.vaskelistaPool ??= new Pool({ connectionString: url, max: 5 }));
}

export type Db = { query: (text: string, params?: unknown[]) => Promise<any[]> };

export function db(): Db {
  const p = pool();
  return { query: async (text, params) => (await p.query(text, params as any[])).rows };
}
