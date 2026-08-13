import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";
import { parseMusicUrl } from "@/lib/parse";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Código incorrecto." }, 403);

  const parsed = parseMusicUrl(String(body.url ?? ""));
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const title = String(body.title ?? "").trim().slice(0, 140);
  if (!title) return json({ error: "La pista necesita título." }, 400);

  const rawDur = Number(body.durationSec);
  const durationSec = Number.isFinite(rawDur) && rawDur > 0 ? Math.min(Math.round(rawDur), 3600) : 210;

  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(tracks)
    .where(eq(tracks.artistId, artistId));
  const position = Number(countRows[0]?.n ?? 0);

  const [track] = await db
    .insert(tracks)
    .values({
      artistId,
      platform: parsed.platform,
      kind: parsed.kind,
      externalId: parsed.externalId,
      url: String(body.url).trim().slice(0, 500),
      title,
      durationSec,
      position,
    })
    .returning();

  return json({ track }, 201);
}
