import { randomBytes } from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, images, messages, tracks, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { hashPassword, isValidEmail, passwordStrength } from "@/lib/auth";
import { RESERVED_SLUGS, slugify } from "@/lib/parse";

export const dynamic = "force-dynamic";

/** GET = vista global de moderación. */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });

  const [artistRows, userRows, messageCount] = await Promise.all([
    db
      .select({
        id: artists.id,
        slug: artists.slug,
        name: artists.name,
        city: artists.city,
        genres: artists.genres,
        coverUrl: artists.coverUrl,
        moderationStatus: artists.moderationStatus,
        moderationNote: artists.moderationNote,
        verificationStatus: artists.verificationStatus,
        verificationNote: artists.verificationNote,
        verifiedAt: artists.verifiedAt,
        docCount: sql<number>`(select count(*) from verification_docs where verification_docs.artist_id = ${artists.id})`.as("doc_count"),
        createdAt: artists.createdAt,
        ownerEmail: users.email,
        ownerRole: users.role,
        trackCount: sql<number>`(select count(*) from tracks where tracks.artist_id = ${artists.id})`.as("track_count"),
        imageCount: sql<number>`(select count(*) from images where images.artist_id = ${artists.id})`.as("image_count"),
        messageCount: sql<number>`(select count(*) from messages where messages.artist_id = ${artists.id})`.as("message_count"),
        plays: sql<number>`(select coalesce(sum(plays), 0) from tracks where tracks.artist_id = ${artists.id})`.as("plays"),
      })
      .from(artists)
      .leftJoin(users, eq(users.artistId, artists.id))
      .orderBy(desc(artists.createdAt)),
    db.select({ id: users.id, email: users.email, role: users.role, artistId: users.artistId, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)),
    db.select({ n: sql<number>`count(*)` }).from(messages),
  ]);

  return Response.json({ artists: artistRows, users: userRows, messageCount: Number(messageCount[0]?.n ?? 0) });
}

/** POST = administración crea perfil + cuenta de artista. */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 60);
  const slug = slugify(String(body.slug ?? name));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (name.length < 2) return Response.json({ error: "Nombre artístico inválido." }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(slug) || RESERVED_SLUGS.has(slug)) return Response.json({ error: "URL de estación inválida." }, { status: 400 });
  if (!isValidEmail(email)) return Response.json({ error: "Email inválido." }, { status: 400 });
  const strength = passwordStrength(password);
  if (!strength.ok) return Response.json({ error: `Contraseña: ${strength.reason}.` }, { status: 400 });

  const [slugExists, emailExists] = await Promise.all([
    db.select({ id: artists.id }).from(artists).where(eq(artists.slug, slug)).limit(1),
    db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1),
  ]);
  if (slugExists.length) return Response.json({ error: "Esa URL ya existe." }, { status: 409 });
  if (emailExists.length) return Response.json({ error: "Ese email ya tiene cuenta." }, { status: 409 });

  const [artist] = await db
    .insert(artists)
    .values({
      name,
      slug,
      city: String(body.city ?? "").trim().slice(0, 80),
      tagline: String(body.tagline ?? "").trim().slice(0, 120),
      genres: [],
      editToken: randomBytes(16).toString("hex"),
      moderationStatus: "active",
    })
    .returning();
  const [user] = await db.insert(users).values({ email, passwordHash: await hashPassword(password), artistId: artist.id }).returning();
  return Response.json({ artist, user }, { status: 201 });
}
