import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH = editar letra de la pista (dueño). */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const trackId = parseInt(id, 10);
  const url = new URL(req.url);
  const artistId = parseInt(url.searchParams.get("artistId") ?? "", 10);
  if (!Number.isFinite(trackId) || !Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const owner = await authorizedArtist(artistId, url.searchParams.get("token"), req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  const body = await req.json().catch(() => ({}));
  const patch: Partial<typeof tracks.$inferSelect> = {};
  if (body.lyrics !== undefined) patch.lyrics = String(body.lyrics).slice(0, 8000);
  if (body.featured !== undefined) patch.featured = body.featured ? 1 : 0;
  if (Object.keys(patch).length === 0) return json({ error: "Nada que actualizar." }, 400);

  const [track] = await db
    .update(tracks)
    .set(patch)
    .where(and(eq(tracks.id, trackId), eq(tracks.artistId, artistId)))
    .returning();
  if (!track) return json({ error: "Pista no encontrada." }, 404);
  return json({ track });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const trackId = parseInt(id, 10);
  const url = new URL(_req.url);
  const artistId = parseInt(url.searchParams.get("artistId") ?? "", 10);
  const token = url.searchParams.get("token");
  if (!Number.isFinite(trackId) || !Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const owner = await authorizedArtist(artistId, token, _req.headers.get("cookie"));
  if (!owner) return json({ error: "Código incorrecto." }, 403);

  await db.delete(tracks).where(and(eq(tracks.id, trackId), eq(tracks.artistId, artistId)));
  return json({ ok: true });
}
