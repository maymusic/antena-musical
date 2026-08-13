import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function findOwned(url: URL, imageId: number, cookieHeader?: string | null) {
  const artistId = parseInt(url.searchParams.get("artistId") ?? "", 10);
  const token = url.searchParams.get("token");
  if (!Number.isFinite(artistId)) return { error: json({ error: "ID inválido." }, 400) };
  const owner = await authorizedArtist(artistId, token, cookieHeader);
  if (!owner) return { error: json({ error: "Sesión no válida." }, 403) };
  const rows = await db.select().from(images).where(and(eq(images.id, imageId), eq(images.artistId, artistId))).limit(1);
  if (rows.length === 0) return { error: json({ error: "Imagen no encontrada." }, 404) };
  return { image: rows[0] };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const imageId = parseInt(id, 10);
  if (!Number.isFinite(imageId)) return json({ error: "ID inválido." }, 400);
  const owned = await findOwned(new URL(req.url), imageId, req.headers.get("cookie"));
  if (owned.error) return owned.error;
  const body = await req.json().catch(() => ({}));
  const caption = String(body.caption ?? "").trim().slice(0, 160);
  const [image] = await db.update(images).set({ caption }).where(eq(images.id, imageId)).returning();
  return json({ image });
}

/** DELETE = elimina únicamente la referencia; el archivo sigue bajo control del usuario en Drive. */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const imageId = parseInt(id, 10);
  if (!Number.isFinite(imageId)) return json({ error: "ID inválido." }, 400);
  const owned = await findOwned(new URL(req.url), imageId, req.headers.get("cookie"));
  if (owned.error) return owned.error;
  await db.delete(images).where(eq(images.id, imageId));
  return json({ ok: true });
}
