import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, verificationDocs } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function sanitizeArtist(a: typeof artists.$inferSelect) {
  return { ...a, editToken: undefined };
}

/** GET = estado de verificación + documentos (dueño). */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);
  const owner = await authorizedArtist(artistId, undefined, req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  const docs = await db
    .select()
    .from(verificationDocs)
    .where(eq(verificationDocs.artistId, artistId))
    .orderBy(asc(verificationDocs.id));

  return json({
    verificationStatus: owner.verificationStatus,
    verificationNote: owner.verificationNote,
    verifiedAt: owner.verifiedAt,
    docs,
  });
}

/** POST = solicitar la verificación (desde none o rejected). */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  if (owner.verificationStatus === "requested" || owner.verificationStatus === "uploaded") {
    return json({ artist: sanitizeArtist(owner) });
  }
  if (owner.verificationStatus === "approved") {
    return json({ error: "Tu perfil ya está verificado." }, 400);
  }

  const [artist] = await db
    .update(artists)
    .set({ verificationStatus: "requested", verificationNote: "" })
    .where(eq(artists.id, artistId))
    .returning();

  return json({ artist: sanitizeArtist(artist) });
}
