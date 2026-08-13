import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, artists } from "@/db/schema";
import {
  getEmailFromCookie,
  hashPassword,
  isValidEmail,
  passwordStrength,
  sessionCookie,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET = ver quién está logueado (si hay cookie válida) */
export async function GET(req: Request) {
  const email = getEmailFromCookie(req.headers.get("cookie"));
  if (!email) return Response.json({ logged: false }, { status: 200 });
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) return Response.json({ logged: false }, { status: 200 });
  let artistSlug: string | null = null;
  if (user.artistId) {
    const artist = await db.select({ slug: artists.slug }).from(artists).where(eq(artists.id, user.artistId)).limit(1);
    artistSlug = artist[0]?.slug ?? null;
  }
  return Response.json({
    logged: true,
    email: user.email,
    artistId: user.artistId,
    artistSlug,
    role: user.role,
  });
}

/** POST = registro con email + contraseña + (opcionalmente) artista recién creado */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!isValidEmail(email)) {
    return Response.json({ error: "Email no válido." }, { status: 400 });
  }
  const strength = passwordStrength(password);
  if (!strength.ok) {
    return Response.json({ error: `Contraseña demasiado débil: ${strength.reason}.` }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return Response.json({ error: "Ese email ya tiene cuenta. Inicia sesión." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const artistIdInput = Number(body.artistId);
  const artistId = Number.isFinite(artistIdInput) && artistIdInput > 0 ? artistIdInput : null;

  if (artistId) {
    const taken = await db.select({ id: users.id }).from(users).where(eq(users.artistId, artistId)).limit(1);
    if (taken.length > 0) {
      return Response.json({ error: "Esta estación ya tiene un usuario asignado." }, { status: 409 });
    }
  }

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, artistId })
    .returning();

  const token = signTokenFromUser(user);
  return Response.json(
    { ok: true, email: user.email, artistId: user.artistId },
    { status: 201, headers: { "Set-Cookie": sessionCookie(token) } }
  );
}

import { signToken } from "@/lib/auth";

function signTokenFromUser(user: { id: number; email: string; artistId: number | null }) {
  return signToken({
    userId: user.id,
    email: user.email,
    artistId: user.artistId ?? undefined,
  });
}
