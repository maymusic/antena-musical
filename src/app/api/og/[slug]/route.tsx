import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Tarjeta de previsualización para compartir en WhatsApp, Facebook, X, etc.
 *
 * Se genera en nuestro servidor: así funciona aunque la foto del artista viva
 * en Google Drive (que bloquea el acceso directo de los rastreadores sociales).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const rows = await db
    .select()
    .from(artists)
    .where(and(eq(artists.slug, slug), eq(artists.moderationStatus, "active")))
    .limit(1);
  const artist = rows[0];

  const name = artist?.name ?? "ANTENA MUSICAL";
  const tagline = artist?.tagline || (artist ? `${artist.genres.slice(0, 3).join(" · ")}` : "Radios de artista");
  const city = artist?.city ?? "";
  const accent = artist?.accent ?? "#FF4D00";
  const verified = artist?.verificationStatus === "approved";

  // Descargamos la foto en el servidor y la incrustamos en base64.
  let photo: string | null = null;
  const source = artist?.avatarUrl || artist?.coverUrl || "";
  if (source) {
    try {
      // Pedimos una versión pequeña: la tarjeta debe pesar poco o WhatsApp la descarta.
      const light = source.replace(/([?&]sz=)w\d+/, "$1w640");
      const absolute = light.startsWith("http") ? light : `${getOrigin(_req)}${light}`;
      const res = await fetch(absolute, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const type = res.headers.get("content-type") ?? "image/jpeg";
        if (type.startsWith("image/")) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 0 && buf.length < 8_000_000) {
            photo = `data:${type};base64,${buf.toString("base64")}`;
          }
        }
      }
    } catch {
      /* si falla, se usa el diseño sin foto */
    }
  }

  const PHOTO = 430;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#16120e",
          backgroundImage: "linear-gradient(135deg, #16120e 0%, #221a13 55%, #16120e 100%)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, backgroundColor: accent, display: "flex" }} />

        {/* Columna de texto */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0 46px 0 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 30 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                backgroundColor: accent,
                color: "#16120e",
                fontSize: 25,
                fontWeight: 800,
              }}
            >
              ◎
            </div>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: "#f2e9da", fontWeight: 700 }}>
              ANTENA MUSICAL
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                fontSize: name.length > 20 ? 62 : name.length > 12 ? 78 : 92,
                fontWeight: 800,
                color: "#f2e9da",
                lineHeight: 1,
              }}
            >
              {name.length > 30 ? `${name.slice(0, 30)}…` : name}
            </div>
            {verified ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 50,
                  height: 50,
                  borderRadius: 50,
                  backgroundColor: "#4DA6FF",
                  color: "#0b1220",
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
            ) : null}
          </div>

          {tagline ? (
            <div style={{ display: "flex", fontSize: 30, color: "#cbbda6", marginBottom: 26, lineHeight: 1.25 }}>
              {tagline.length > 62 ? `${tagline.slice(0, 62)}…` : tagline}
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 18px",
                border: "2px solid #43e56c",
                color: "#43e56c",
                fontSize: 17,
                letterSpacing: 3,
              }}
            >
              ● ON AIR 24/7
            </div>
            {city ? (
              <div style={{ display: "flex", fontSize: 20, color: "#b8ab97", letterSpacing: 2 }}>{city}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", fontSize: 26, color: accent, fontWeight: 700, letterSpacing: 1 }}>
            ▶ Escuchar su estación de radio
          </div>
        </div>

        {/* Retrato del artista */}
        <div style={{ display: "flex", padding: "0 68px 0 0" }}>
          <div
            style={{
              display: "flex",
              width: PHOTO,
              height: PHOTO,
              border: `6px solid ${accent}`,
              backgroundColor: "#241c14",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {photo ? (
              <img src={photo} width={PHOTO} height={PHOTO} style={{ width: PHOTO, height: PHOTO, objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", fontSize: 200, fontWeight: 800, color: accent }}>{name.charAt(0)}</div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Las redes sociales cachean la tarjeta; esto evita regenerarla en cada visita.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}

function getOrigin(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}
