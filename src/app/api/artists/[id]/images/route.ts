import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, images } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";
import { normalizeGoogleDriveImage } from "@/lib/drive";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST = registra un enlace público de Google Drive.
 * No se recibe ni se almacena ningún archivo en ANTENA MUSICAL.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  const drive = normalizeGoogleDriveImage(String(body.url ?? ""));
  if (!drive) {
    return json(
      {
        error:
          "Usa un enlace público de Google Drive. En Drive: Compartir → Acceso general «Cualquier persona con el enlace» → Copiar enlace.",
      },
      400
    );
  }

  const asCover = String(body.asCover ?? "");
  let artist = owner;
  if (asCover === "cover" || asCover === "avatar") {
    const [updated] = await db
      .update(artists)
      .set(asCover === "cover" ? { coverUrl: drive.displayUrl } : { avatarUrl: drive.displayUrl })
      .where(eq(artists.id, artistId))
      .returning();
    artist = updated;
    return json({ artist: { ...artist, editToken: undefined }, drive }, 201);
  }

  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(images)
    .where(eq(images.artistId, artistId));
  const position = Number(countRows[0]?.n ?? 0);
  const [image] = await db.insert(images).values({ artistId, url: drive.displayUrl, position }).returning();

  return json({ image, drive }, 201);
}
