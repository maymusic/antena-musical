import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Tarjeta para compartir UNA canción concreta.
 * Lleva la carátula del video, el título de la canción, el artista y su
 * palomita azul si está verificado.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const id = Number(trackId);

  const rows = Number.isFinite(id)
    ? await db
        .select({ track: tracks, artist: artists })
        .from(tracks)
        .innerJoin(artists, eq(tracks.artistId, artists.id))
        .where(and(eq(tracks.id, id), eq(artists.moderationStatus, "active")))
        .limit(1)
    : [];

  const row = rows[0];
  const title = row?.track.title ?? "ANTENA MUSICAL";
  const artistName = row?.artist.name ?? "Radio de artista";
  const accent = row?.artist.accent ?? "#FF4D00";
  const verified = row?.artist.verificationStatus === "approved";
  const featured = (row?.track.featured ?? 0) === 1;

  // Carátula: miniatura de YouTube o portada del artista
  let art: string | null = null;
  const source =
    row?.track.platform === "youtube" && row.track.externalId
      ? `https://i.ytimg.com/vi/${row.track.externalId}/hqdefault.jpg`
      : row?.artist.avatarUrl || row?.artist.coverUrl || "";

  if (source) {
    try {
      const light = source.replace(/([?&]sz=)w\d+/, "$1w640");
      const absolute = light.startsWith("http") ? light : `${getOrigin(_req)}${light}`;
      const res = await fetch(absolute, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const type = res.headers.get("content-type") ?? "image/jpeg";
        if (type.startsWith("image/")) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 0 && buf.length < 8_000_000) art = `data:${type};base64,${buf.toString("base64")}`;
        }
      }
    } catch {
      /* sin carátula: diseño de respaldo */
    }
  }

  const ART = 430;

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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 16, backgroundColor: accent, display: "flex" }} />

        <div style={{ display: "flex", flex: 1, alignItems: "center", paddingTop: 30 }}>
          {/* Texto */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: 72, paddingRight: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
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
              <span style={{ fontSize: 19, letterSpacing: 6, color: "#f2e9da", fontWeight: 700 }}>ANTENA MUSICAL</span>
            </div>

            <div style={{ display: "flex", marginBottom: 12 }}>
              <span
                style={{
                  display: "flex",
                  padding: "6px 16px",
                  border: `2px solid ${accent}`,
                  color: accent,
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: 3,
                }}
              >
                {featured ? "★ CANCIÓN DESTACADA" : "▶ SUENA AHORA"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: title.length > 34 ? 46 : title.length > 20 ? 60 : 76,
                fontWeight: 800,
                color: "#f2e9da",
                lineHeight: 1.05,
                marginBottom: 18,
              }}
            >
              {title.length > 52 ? `${title.slice(0, 52)}…` : title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 30, color: "#cbbda6" }}>{artistName}</span>
              {verified ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: 38,
                    backgroundColor: "#4DA6FF",
                  }}
                >
                  <span style={{ color: "#0b1220", fontSize: 22, fontWeight: 900 }}>✓</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Carátula */}
          <div style={{ display: "flex", paddingRight: 68, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                width: ART,
                height: ART,
                border: `6px solid ${accent}`,
                backgroundColor: "#241c14",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
              }}
            >
              {art ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={art} width={ART} height={ART} style={{ width: ART, height: ART, objectFit: "cover" }} alt={title} />
              ) : (
                <span style={{ display: "flex", fontSize: 180, fontWeight: 800, color: accent }}>♪</span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "14px 72px",
            borderTop: "1px solid #2b2118",
          }}
        >
          <span style={{ fontSize: 16, color: "#6b5d4c", letterSpacing: 1 }}>Radio online de artistas independientes</span>
          <span style={{ fontSize: 16, color: accent, fontWeight: 700, letterSpacing: 2 }}>● ON AIR 24/7</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
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
