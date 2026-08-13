import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shows } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const showId = parseInt(id, 10);
  const url = new URL(_req.url);
  const artistId = parseInt(url.searchParams.get("artistId") ?? "", 10);
  const token = url.searchParams.get("token");
  if (!Number.isFinite(showId) || !Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const owner = await authorizedArtist(artistId, token, _req.headers.get("cookie"));
  if (!owner) return json({ error: "Código incorrecto." }, 403);

  await db.delete(shows).where(and(eq(shows.id, showId), eq(shows.artistId, artistId)));
  return json({ ok: true });
}
