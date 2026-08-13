import { randomBytes } from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks, images, users } from "@/db/schema";
import { json } from "@/lib/api";
import { RESERVED_SLUGS, slugify } from "@/lib/parse";
import { hashPassword, isValidEmail, passwordStrength, sessionCookie, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: artists.id,
      slug: artists.slug,
      name: artists.name,
      tagline: artists.tagline,
      genres: artists.genres,
      city: artists.city,
      coverUrl: artists.coverUrl,
      avatarUrl: artists.avatarUrl,
      accent: artists.accent,
      createdAt: artists.createdAt,
      trackCount: sql<number>`(select count(*) from tracks where tracks.artist_id = ${artists.id})`.as("track_count"),
    })
    .from(artists)
    .where(eq(artists.moderationStatus, "active"))
    .orderBy(desc(artists.createdAt));
  return json({ artists: rows });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const name = String(body.name ?? "").trim();
  const slug = slugify(String(body.slug ?? ""));
  const tagline = String(body.tagline ?? "").trim().slice(0, 120);
  const city = String(body.city ?? "").trim().slice(0, 80);
  const bio = String(body.bio ?? "").trim().slice(0, 4000);
  const genres = Array.isArray(body.genres)
    ? body.genres.map((g) => String(g)).filter(Boolean).slice(0, 5)
    : [];
  const accent = typeof body.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(body.accent) ? body.accent.toUpperCase() : "#FF4D00";
  const socials: Record<string, string> = {};
  if (body.socials && typeof body.socials === "object") {
    for (const [k, v] of Object.entries(body.socials as Record<string, unknown>)) {
      const val = String(v ?? "").trim().slice(0, 200);
      if (val) socials[k.slice(0, 30)] = val;
    }
  }

  if (name.length < 2) return json({ error: "El nombre artístico necesita al menos 2 caracteres." }, 400);
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(slug)) {
    return json({ error: "La frecuencia (slug) solo puede usar letras, números y guiones." }, 400);
  }
  if (RESERVED_SLUGS.has(slug)) return json({ error: "Esa frecuencia está reservada. Elige otra." }, 409);

  const existing = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, slug)).limit(1);
  if (existing.length > 0) {
    return json({ error: "Esa frecuencia ya está ocupada. Prueba con otro nombre." }, 409);
  }

  // ====== Autenticación obligatoria ======
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!isValidEmail(email)) return json({ error: "Indica un email válido (lo usarás para entrar)." }, 400);
  const strength = passwordStrength(password);
  if (!strength.ok) return json({ error: `Contraseña débil: ${strength.reason}.` }, 400);

  const userExists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (userExists.length > 0) {
    return json({ error: "Ese email ya tiene cuenta. Inicia sesión o usa otro." }, 409);
  }

  const editToken = randomBytes(16).toString("hex");
  const [artist] = await db
    .insert(artists)
    .values({ slug, name, tagline, city, bio, genres, accent, socials, editToken })
    .returning();

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, artistId: artist.id })
    .returning();

  const jwt = signToken({ userId: user.id, email: user.email, artistId: artist.id });
  return json(
    {
      artist: { ...artist, editToken: undefined },
      user: { id: user.id, email: user.email, artistId: user.artistId },
    },
    201,
    { "Set-Cookie": sessionCookie(jwt) }
  );
}
