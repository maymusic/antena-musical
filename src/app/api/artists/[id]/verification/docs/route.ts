import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, verificationDocs } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Sesión no válida." }, 403);

  if (owner.verificationStatus === "none") {
    return json({ error: "Primero pulsa «Verificar mi perfil» para iniciar la solicitud." }, 400);
  }
  if (owner.verificationStatus === "approved") {
    return json({ error: "Tu perfil ya está verificado." }, 400);
  }

  const url = String(body.url ?? "").trim();
  if (!/^https?:\/\/\S{8,1200}$/.test(url)) {
    return json({ error: "Pega un enlace http(s) válido (Google Drive es lo ideal)." }, 400);
  }
  const label = String(body.label ?? "").trim().slice(0, 60);

  const [doc] = await db
    .insert(verificationDocs)
    .values({ artistId, url, label })
    .returning();

  let artist = owner;
  if (owner.verificationStatus === "requested") {
    const [updated] = await db
      .update(artists)
      .set({ verificationStatus: "uploaded" })
      .where(eq(artists.id, artistId))
      .returning();
    artist = updated;
  }

  return json({ doc, artist: { ...artist, editToken: undefined } }, 201);
}
