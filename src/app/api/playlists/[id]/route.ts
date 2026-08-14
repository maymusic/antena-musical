import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { playlists } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";
import { json } from "@/lib/api";
import { getPlaylistDetail } from "@/lib/playlists";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return json({ error: "Inicia sesión." }, 401);

  const { id } = await params;
  const playlistId = Number(id);
  if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);

  const detail = await getPlaylistDetail(payload.userId, playlistId);
  if (!detail) return json({ error: "Playlist no encontrada." }, 404);

  return json(detail);
}

/** PATCH = publicar/ocultar o editar una playlist propia. */
export async function PATCH(req: Request, { params }: Ctx) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return json({ error: "Inicia sesión." }, 401);

  const { id } = await params;
  const playlistId = Number(id);
  if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const patch: Partial<typeof playlists.$inferInsert> = {};

  if (body.isPublic !== undefined) patch.isPublic = body.isPublic ? 1 : 0;
  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 80);
    if (name.length < 2) return json({ error: "El nombre necesita al menos 2 caracteres." }, 400);
    patch.name = name;
  }
  if (body.description !== undefined) patch.description = String(body.description).trim().slice(0, 240);
  if (Object.keys(patch).length === 0) return json({ error: "Nada que actualizar." }, 400);

  const [playlist] = await db
    .update(playlists)
    .set(patch)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, payload.userId)))
    .returning();

  if (!playlist) return json({ error: "Playlist no encontrada." }, 404);
  return json({ playlist });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const payload = getPayloadFromCookie(req.headers.get("cookie"));
  if (!payload) return json({ error: "Inicia sesión." }, 401);

  const { id } = await params;
  const playlistId = Number(id);
  if (!Number.isFinite(playlistId)) return json({ error: "ID inválido." }, 400);

  await db
    .delete(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, payload.userId)));

  return json({ ok: true });
}
