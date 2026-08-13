import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH = estado y nota de moderación. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const { id } = await params;
  const artistId = Number(id);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!["active", "suspended", "pending"].includes(status)) return Response.json({ error: "Estado inválido." }, { status: 400 });
  const note = String(body.note ?? "").trim().slice(0, 1000);
  const [artist] = await db.update(artists).set({ moderationStatus: status, moderationNote: note }).where(eq(artists.id, artistId)).returning();
  if (!artist) return Response.json({ error: "Perfil no encontrado." }, { status: 404 });
  return Response.json({ artist });
}

/** DELETE = elimina un perfil y su contenido. */
export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const { id } = await params;
  const artistId = Number(id);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });
  await db.update(users).set({ artistId: null }).where(eq(users.artistId, artistId));
  await db.delete(artists).where(eq(artists.id, artistId));
  return Response.json({ ok: true });
}
