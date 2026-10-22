import { currentUser, login, logout } from "@/lib/auth";
import { initialize } from "@/lib/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try {
    await initialize();
    const user = await currentUser();
    return user
      ? Response.json({ user }, { headers })
      : Response.json({ error: "Ikke innlogget." }, { status: 401, headers });
  } catch {
    return Response.json({ error: "Kunne ikke kontrollere innloggingen." }, { status: 503, headers });
  }
}
export async function POST(req: Request) {
  try {
    if (req.headers.get("origin") && req.headers.get("origin") !== new URL(req.url).origin)
      return Response.json({ error: "Ugyldig avsender." }, { status: 403 });
    const b: any = await req.json();
    if (b.action === "logout") {
      await logout();
      return Response.json({ ok: true }, { headers });
    }
    if (b.action === "login") {
      await initialize();
      const user = await login(b.username, b.password);
      return user
        ? Response.json({ user }, { headers })
        : Response.json({ error: "Feil brukernavn eller passord." }, { status: 401, headers });
    }
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  } catch {
    return Response.json({ error: "Kunne ikke logge inn. Prøv igjen." }, { status: 503, headers });
  }
}
