import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, users } from "@/db/schema";
import {
  clearSessionCookie,
  sessionCookie,
  signToken,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST = login con email + contraseña */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return Response.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    return Response.json({ error: "Credenciales incorrectas." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return Response.json({ error: "Credenciales incorrectas." }, { status: 401 });
  }

  let artistSlug: string | null = null;
  if (user.artistId) {
    const artist = await db.select({ slug: artists.slug }).from(artists).where(eq(artists.id, user.artistId)).limit(1);
    artistSlug = artist[0]?.slug ?? null;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    artistId: user.artistId ?? undefined,
  });

  return Response.json(
    {
      ok: true,
      email: user.email,
      artistId: user.artistId,
      artistSlug,
      role: user.role,
    },
    { headers: { "Set-Cookie": sessionCookie(token) } }
  );
}

/** DELETE = cerrar sesión */
export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
