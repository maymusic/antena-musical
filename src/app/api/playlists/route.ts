import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { playlistTracks, playlists } from "@/db/schema";
import { getPayloadFromCookie } from "@/lib/auth";
import { json, safeRoute } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ playlists: [] });

    const rows = await db
      .select({
        id: playlists.id,
        name: playlists.name,
        description: playlists.description,
        createdAt: playlists.createdAt,
        trackCount: sql<number>`count(${playlistTracks.id})`.as("trackCount"),
      })
      .from(playlists)
      .leftJoin(playlistTracks, eq(playlistTracks.playlistId, playlists.id))
      .where(eq(playlists.userId, payload.userId))
      .groupBy(playlists.id)
      .orderBy(asc(playlists.id));

    return json({ playlists: rows.map((p) => ({ ...p, trackCount: Number(p.trackCount ?? 0) })) });
  });
}

export async function POST(req: Request) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ error: "Inicia sesión para crear playlists." }, 401);

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim().slice(0, 80);
    const description = String(body.description ?? "").trim().slice(0, 240);
    if (name.length < 2) return json({ error: "Ponle un nombre a tu playlist." }, 400);

    const [playlist] = await db
      .insert(playlists)
      .values({ userId: payload.userId, name, description })
      .returning();

    return json({ playlist }, 201);
  });
}

export async function DELETE(req: Request) {
  return safeRoute(async () => {
    const payload = getPayloadFromCookie(req.headers.get("cookie"));
    if (!payload) return json({ error: "Inicia sesión." }, 401);

    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return json({ error: "ID inválido." }, 400);

    await db
      .delete(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, payload.userId)));
    return json({ ok: true });
  });
}
