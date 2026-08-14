import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";
import { json, safeRoute } from "@/lib/api";
import { getPlaylistDetail } from "@/lib/playlists";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ error: "Inicia sesión." }, 401);

    const { id } = await params;
    const playlistId = Number(id);
    if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);

    const detail = await getPlaylistDetail(payload.userId, playlistId);
    if (!detail) return json({ error: "Playlist no encontrada." }, 404);

    return json(detail);
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ error: "Inicia sesión." }, 401);

    const { id } = await params;
    const playlistId = Number(id);
    if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);

    await db
      .delete(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, payload.userId)));

    return json({ ok: true });
  });
}
