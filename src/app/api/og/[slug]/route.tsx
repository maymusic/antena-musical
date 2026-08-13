import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Tarjeta de previsualización al compartir (WhatsApp, Facebook, X…).
 *
 * Se genera en el servidor y pesa poco (~380 KB) para que WhatsApp la acepte.
 * Lleva: foto del artista, nombre grande, palomita azul si está verificado,
 * la frecuencia ON AIR, y un trozo de su biografía.
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
  const genres = artist?.genres ?? [];
  const tagline = artist?.tagline || genres.slice(0, 3).join(" · ") || "Radios de artista · 24/7";
  const city = artist?.city ?? "";
  const accent = artist?.accent ?? "#FF4D00";
  const verified = artist?.verificationStatus === "approved";
  // Primer párrafo de la biografía, cortado para que quepa en 3 líneas.
  const bioRaw = (artist?.bio ?? "").split("\n")[0].trim();
  const bio = bioRaw.length > 140 ? `${bioRaw.slice(0, 140).trimEnd()}…` : bioRaw;

  // Fotografía en base64: funciona aunque la foto viva en Google Drive (los
  // crawlers sociales no pueden descargarlas directamente).
  let photo: string | null = null;
  const source = artist?.avatarUrl || artist?.coverUrl || "";
  if (source) {
    try {
      // Versión pequeña: la tarjeta no puede pasar de ~600 KB o WhatsApp la descarta.
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
      /* si la foto falla, usamos el diseño de respaldo */
    }
  }

  const PHOTO = 468;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#16120e",
          backgroundImage: "linear-gradient(135deg, #16120e 0%, #221a13 55%, #16120e 100%)",
          position: "relative",
        }}
      >
        {/* tira de color del artista, en lo alto */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 16, backgroundColor: accent, display: "flex" }} />

        <div style={{ display: "flex", flex: 1, alignItems: "center", paddingTop: 40, paddingBottom: 28 }}>
          {/* Columna de texto */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: 72, paddingRight: 44, minWidth: 0 }}>
            {/* marca */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  backgroundColor: accent,
                  color: "#16120e",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                ◎
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 22, letterSpacing: 7, color: "#f2e9da", fontWeight: 700 }}>ANTENA MUSICAL</span>
                {city ? <span style={{ fontSize: 15, letterSpacing: 3, color: "#b8ab97", marginTop: 5 }}>{city}</span> : null}
              </div>
            </div>

            {/* nombre + palomita */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: name.length > 18 ? 56 : name.length > 11 ? 72 : 92,
                  fontWeight: 800,
                  color: "#f2e9da",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {name.length > 26 ? `${name.slice(0, 26)}…` : name}
              </div>
              {verified ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 52,
                    height: 52,
                    borderRadius: 52,
                    backgroundColor: "#4DA6FF",
                    boxShadow: "0 0 24px rgba(77,166,255,0.45)",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "#0b1220", fontSize: 30, fontWeight: 900 }}>✓</span>
                </div>
              ) : null}
            </div>

            {verified ? (
              <div style={{ display: "flex", marginBottom: 14 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "5px 14px",
                    border: "1px solid rgba(77,166,255,0.55)",
                    backgroundColor: "rgba(77,166,255,0.12)",
                    color: "#8fc0ff",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                  }}
                >
                  ✓ PERFIL VERIFICADO
                </span>
              </div>
            ) : null}

            {/* géneros */}
            <div style={{ display: "flex", fontSize: 26, color: "#cbbda6", marginBottom: bio ? 14 : 20, lineHeight: 1.2, fontStyle: "italic" }}>
              {tagline.length > 58 ? `${tagline.slice(0, 58)}…` : tagline}
            </div>

            {/* trozo de la biografía, hasta 3 líneas */}
            {bio ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 19,
                  lineHeight: 1.45,
                  color: "#b8ab97",
                  marginBottom: 22,
                  maxWidth: 620,
                  overflow: "hidden",
                  // recorte visual a 3 líneas
                  height: 82,
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}
              >
                {bio}
              </div>
            ) : null}

            {/* ON AIR + CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 20px",
                  border: "2px solid #43e56c",
                  color: "#43e56c",
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: 3,
                }}
              >
                ● ON AIR 24/7
              </div>
              <div style={{ display: "flex", fontSize: 23, color: accent, fontWeight: 800, letterSpacing: 1 }}>
                ▶ Escuchar su estación
              </div>
            </div>
          </div>

          {/* Foto del artista */}
          <div style={{ display: "flex", paddingRight: 68, alignItems: "center", flexShrink: 0 }}>
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
                boxShadow: `0 30px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)`,
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  width={PHOTO}
                  height={PHOTO}
                  style={{ width: PHOTO, height: PHOTO, objectFit: "cover" }}
                  alt={name}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex", fontSize: 190, fontWeight: 800, color: accent, lineHeight: 1 }}>
                    {name.charAt(0)}
                  </div>
                  <div style={{ display: "flex", fontSize: 15, letterSpacing: 5, color: "#b8ab97" }}>ANTENA MUSICAL</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* franja inferior con host */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 14,
            paddingLeft: 72,
            paddingRight: 72,
            borderTop: "1px solid #2b2118",
            marginTop: 0,
            paddingTop: 14,
          }}
        >
          <span style={{ fontSize: 16, color: "#6b5d4c", letterSpacing: 1 }}>
            Radio online de artistas independientes
          </span>
          <span style={{ fontSize: 16, color: accent, fontWeight: 700, letterSpacing: 2 }}>
            antena-musical-xi.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Las redes cachean la tarjeta; esto evita regenerarla en cada visita.
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
