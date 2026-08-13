import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, users } from "@/db/schema";
import { authorizedArtist, json, sanitizeHex } from "@/lib/api";
import { normalizeGoogleDriveFile } from "@/lib/drivefile";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST = verificar código de artista */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);
  const body = await req.json().catch(() => ({}));
  const artist = await authorizedArtist(artistId, String(body.token ?? ""));
  if (!artist) return json({ error: "Código incorrecto." }, 403);
  return json({ ok: true });
}

/** PATCH = actualizar perfil */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Código incorrecto." }, 403);

  const patch: Record<string, unknown> = body.patch ?? {};
  const updates: Partial<typeof artists.$inferInsert> = {};

  if (typeof patch.name === "string" && patch.name.trim().length >= 2) {
    updates.name = patch.name.trim().slice(0, 60);
  }
  if (typeof patch.tagline === "string") updates.tagline = patch.tagline.trim().slice(0, 120);
  if (typeof patch.city === "string") updates.city = patch.city.trim().slice(0, 80);
  if (typeof patch.bio === "string") updates.bio = patch.bio.trim().slice(0, 4000);
  if (typeof patch.coverUrl === "string") updates.coverUrl = patch.coverUrl.slice(0, 500);
  if (typeof patch.avatarUrl === "string") updates.avatarUrl = patch.avatarUrl.slice(0, 500);
  if (typeof patch.accent === "string") updates.accent = sanitizeHex(patch.accent, owner.accent);
  if (Array.isArray(patch.genres)) {
    updates.genres = patch.genres.map((g) => String(g)).filter(Boolean).slice(0, 5);
  }
  if (patch.socials && typeof patch.socials === "object") {
    const socials: Record<string, string> = {};
    for (const [k, v] of Object.entries(patch.socials as Record<string, unknown>)) {
      const val = String(v ?? "").trim().slice(0, 200);
      if (val) socials[k.slice(0, 30)] = val;
    }
    updates.socials = socials;
  }
  if (typeof patch.phone === "string") updates.phone = patch.phone.trim().slice(0, 40);
  if (typeof patch.booking === "string") updates.booking = patch.booking.trim().slice(0, 300);
  if (typeof patch.presskitLabel === "string") updates.presskitLabel = patch.presskitLabel.trim().slice(0, 120);
  if (typeof patch.presskitUrl === "string") {
    const raw = patch.presskitUrl.trim();
    if (raw === "") {
      updates.presskitUrl = "";
    } else {
      const drive = normalizeGoogleDriveFile(raw);
      if (!drive) {
        return json(
          { error: "El press kit debe ser un enlace público de Google Drive (archivo o carpeta compartida)." },
          400
        );
      }
      updates.presskitUrl = drive.viewUrl;
    }
  }
  if (Array.isArray(patch.credits)) {
    updates.credits = (patch.credits as unknown[])
      .map((c) => {
        const item = c as Record<string, unknown>;
        return {
          role: String(item.role ?? "").trim().slice(0, 60),
          name: String(item.name ?? "").trim().slice(0, 120),
        };
      })
      .filter((c) => c.role && c.name)
      .slice(0, 30);
  }

  if (Object.keys(updates).length === 0) return json({ error: "Nada que actualizar." }, 400);

  const [artist] = await db
    .update(artists)
    .set(updates)
    .where(eq(artists.id, artistId))
    .returning();
  return json({ artist: { ...artist, editToken: undefined } });
}

/** DELETE = eliminar la estación (cascada: pistas, fotos, fechas, chat). */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  if (owner.slug !== String(body.slug ?? "")) {
    return json({ error: "Escribe la URL exacta de la estación para confirmar." }, 400);
  }

  // desvincula el usuario (si existe) antes del borrado en cascada
  await db.update(users).set({ artistId: null }).where(eq(users.artistId, artistId));
  await db.delete(artists).where(eq(artists.id, artistId));

  return json({ ok: true });
}
