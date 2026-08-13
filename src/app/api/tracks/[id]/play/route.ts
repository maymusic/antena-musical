import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

/** POST = registrar una reproducción (público, fire-and-forget). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trackId = parseInt(id, 10);
  if (!Number.isFinite(trackId)) return Response.json({ error: "ID inválido." }, { status: 400 });
  await db
    .update(tracks)
    .set({ plays: sql`${tracks.plays} + 1` })
    .where(eq(tracks.id, trackId));
  return Response.json({ ok: true });
}
