import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST = reordenar la rotación (ids en el orden nuevo). */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  const ids: number[] = Array.isArray(body.ids)
    ? (body.ids as unknown[]).map((x) => Number(x)).filter((x) => Number.isFinite(x))
    : [];
  if (ids.length === 0 || ids.length > 200) return json({ error: "Orden inválido." }, 400);

  // valida que todas las pistas pertenecen al artista
  const owned = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(and(eq(tracks.artistId, artistId), sql`${tracks.id} = ANY(${ids})`));
  if (owned.length !== ids.length) return json({ error: "Alguna pista no es tuya." }, 403);

  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i += 1) {
      await tx.update(tracks).set({ position: i }).where(eq(tracks.id, ids[i]));
    }
  });

  return json({ ok: true });
}
