import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { playlistTracks, playlists, tracks } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";
import { json, safeRoute } from "@/lib/api";
import { getPlaylistDetail } from "@/lib/playlists";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function ownedPlaylist(userId: number, playlistId: number) {
  const [row] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function POST(req: Request, { params }: Ctx) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ error: "Inicia sesión para añadir canciones." }, 401);

    const { id } = await params;
    const playlistId = Number(id);
    if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);
    if (!(await ownedPlaylist(payload.userId, playlistId))) return json({ error: "Playlist no encontrada." }, 404);

    const body = await req.json().catch(() => ({}));
    const trackId = Number(body.trackId);
    if (!Number.isFinite(trackId)) return json({ error: "Canción inválida." }, 400);

    const [track] = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.id, trackId)).limit(1);
    if (!track) return json({ error: "Canción no encontrada." }, 404);

    const existing = await db
      .select({ id: playlistTracks.id })
      .from(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
      .limit(1);
    if (existing[0]) return json({ ok: true, already: true });

    const [countRow] = await db
      .select({ n: sql<number>`count(*)` })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));

    const [item] = await db
      .insert(playlistTracks)
      .values({ playlistId, trackId, position: Number(countRow?.n ?? 0) })
      .returning();

    return json({ ok: true, item }, 201);
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ error: "Inicia sesión." }, 401);

    const { id } = await params;
    const playlistId = Number(id);
    if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);
    if (!(await ownedPlaylist(payload.userId, playlistId))) return json({ error: "Playlist no encontrada." }, 404);

    const url = new URL(req.url);
    const itemId = Number(url.searchParams.get("itemId"));
    const trackId = Number(url.searchParams.get("trackId"));

    if (Number.isFinite(itemId)) {
      await db
        .delete(playlistTracks)
        .where(and(eq(playlistTracks.id, itemId), eq(playlistTracks.playlistId, playlistId)));
    } else if (Number.isFinite(trackId)) {
      await db
        .delete(playlistTracks)
        .where(and(eq(playlistTracks.trackId, trackId), eq(playlistTracks.playlistId, playlistId)));
    } else {
      return json({ error: "Indica itemId o trackId." }, 400);
    }

    const detail = await getPlaylistDetail(payload.userId, playlistId);
    return json({ ok: true, playlist: detail?.playlist, items: detail?.items ?? [] });
  });
}
