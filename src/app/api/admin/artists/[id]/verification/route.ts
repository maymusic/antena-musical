import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, verificationDocs } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET = ver el estado y los documentos del artista (admin). */
export async function GET(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const { id } = await params;
  const artistId = Number(id);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });

  const rows = await db.select().from(artists).where(eq(artists.id, artistId)).limit(1);
  const artist = rows[0];
  if (!artist) return Response.json({ error: "Perfil no encontrado." }, { status: 404 });

  const docs = await db
    .select()
    .from(verificationDocs)
    .where(eq(verificationDocs.artistId, artistId))
    .orderBy(asc(verificationDocs.id));

  return Response.json({
    verificationStatus: artist.verificationStatus,
    verificationNote: artist.verificationNote,
    verifiedAt: artist.verifiedAt,
    docs,
  });
}

/** PATCH = pedir documentos (nota), aprobar (paloma azul) o rechazar. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const { id } = await params;
  const artistId = Number(id);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  const note = String(body.note ?? "").trim().slice(0, 500);

  const patch: Record<string, unknown> = {};
  if (note) patch.verificationNote = note;

  if (status === "approved") {
    patch.verificationStatus = "approved";
    patch.verifiedAt = new Date();
    patch.verificationNote = "";
  } else if (status === "rejected") {
    patch.verificationStatus = "rejected";
    patch.verifiedAt = null;
    if (!note) patch.verificationNote = "Documentos insuficientes. Puedes intentarlo de nuevo.";
  } else if (status !== "" && !["approved", "rejected"].includes(status)) {
    return Response.json({ error: "Estado inválido." }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const [artist] = await db.update(artists).set(patch).where(eq(artists.id, artistId)).returning();
  if (!artist) return Response.json({ error: "Perfil no encontrado." }, { status: 404 });
  return Response.json({ artist });
}
