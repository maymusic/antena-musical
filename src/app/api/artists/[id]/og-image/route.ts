import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Proxy de imagen para vistas previas al compartir (Open Graph).
 * Los rastreadores de WhatsApp/Facebook/X no pueden leer imágenes de Google Drive,
 * así que las servimos desde nuestro propio dominio.
 * Prioriza avatar (foto de perfil) y usa portada como respaldo.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return new Response("Not found", { status: 404 });

  const rows = await db
    .select({ avatarUrl: artists.avatarUrl, coverUrl: artists.coverUrl })
    .from(artists)
    .where(eq(artists.id, artistId))
    .limit(1);
  const artist = rows[0];
  if (!artist) return new Response("Not found", { status: 404 });

  let src = artist.avatarUrl || artist.coverUrl || "";

  // Imagen local del propio deploy (demos) → redirige directo
  if (src.startsWith("/")) {
    const origin = new URL(req.url).origin;
    return Response.redirect(`${origin}${src}`, 302);
  }

  // Normaliza miniaturas de Drive a tamaño grande
  if (src.includes("drive.google.com")) {
    const m = src.match(/[?&]id=([a-zA-Z0-9_-]+)/) || src.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) src = `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`;
  }

  if (!src) return new Response("No image", { status: 404 });

  try {
    const upstream = await fetch(src, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AntenaMusicalBot/1.0)" },
      redirect: "follow",
    });
    if (!upstream.ok) return new Response("Upstream error", { status: 502 });

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return new Response("Not an image", { status: 415 });

    const buffer = await upstream.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }
}
