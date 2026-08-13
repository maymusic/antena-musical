import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { artists, favorites } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return Response.json({ favorites: [] });

  const rows = await db
    .select({
      id: artists.id,
      slug: artists.slug,
      name: artists.name,
      accent: artists.accent,
      verificationStatus: artists.verificationStatus,
    })
    .from(favorites)
    .innerJoin(artists, eq(favorites.artistId, artists.id))
    .where(eq(favorites.userId, payload.userId));

  return Response.json({ favorites: rows });
}

export async function POST(req: Request) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return Response.json({ error: "Inicia sesión para guardar en tu cuenta sincronizada." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const artistId = Number(body.artistId);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, payload.userId), eq(favorites.artistId, artistId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return Response.json({ favorited: false });
  } else {
    await db.insert(favorites).values({ userId: payload.userId, artistId });
    return Response.json({ favorited: true });
  }
}
