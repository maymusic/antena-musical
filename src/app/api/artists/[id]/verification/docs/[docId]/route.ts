import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, verificationDocs } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(req: Request, { params }: Ctx) {
  const { id, docId } = await params;
  const artistId = parseInt(id, 10);
  const documentId = parseInt(docId, 10);
  if (!Number.isFinite(artistId) || !Number.isFinite(documentId)) return json({ error: "ID inválido." }, 400);

  const owner = await authorizedArtist(artistId, undefined, req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  await db
    .delete(verificationDocs)
    .where(and(eq(verificationDocs.id, documentId), eq(verificationDocs.artistId, artistId)));

  let artist = owner;
  if (owner.verificationStatus === "uploaded") {
    const remaining = await db
      .select({ n: sql<number>`count(*)` })
      .from(verificationDocs)
      .where(eq(verificationDocs.artistId, artistId));
    if (Number(remaining[0]?.n ?? 0) === 0) {
      const [updated] = await db
        .update(artists)
        .set({ verificationStatus: "requested" })
        .where(eq(artists.id, artistId))
        .returning();
      artist = updated;
    }
  }

  return json({ artist: { ...artist, editToken: undefined } });
}
