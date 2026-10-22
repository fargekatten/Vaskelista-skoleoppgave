import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const SESSION_COOKIE = "vaskelista_session";
const SESSION_DAYS = 30;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export type SessionUser = { id: number; username: string; person: number };

export async function login(username: unknown, password: unknown) {
  if (typeof username !== "string" || typeof password !== "string") return null;
  const rows = await db().query(
    "SELECT id, username, password_hash, person FROM users WHERE username=$1",
    [username.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db().query(
    "INSERT INTO sessions (token_hash, user_id, expires) VALUES ($1,$2,$3)",
    [sha256(token), user.id, expires.toISOString()],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires,
  });
  return { id: user.id, username: user.username, person: user.person } as SessionUser;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().query("DELETE FROM sessions WHERE token_hash=$1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db().query(
    "SELECT u.id, u.username, u.person FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires > now()",
    [sha256(token)],
  );
  return rows[0] ?? null;
}
