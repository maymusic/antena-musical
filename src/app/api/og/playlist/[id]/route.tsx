import { ImageResponse } from "next/og";
import { getPublicPlaylistDetail } from "@/lib/playlists";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tarjeta al compartir una playlist pública. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlistId = Number(id);
  const detail = Number.isFinite(playlistId) ? await getPublicPlaylistDetail(playlistId) : null;

  const name = detail?.playlist.name ?? "Playlist pública";
  const first = detail?.items[0] ?? null;
  const accent = first?.accent ?? "#FF4D00";
  const count = detail?.items.length ?? 0;

  let art: string | null = null;
  const source =
    first?.platform === "youtube" && first.externalId
      ? `https://i.ytimg.com/vi/${first.externalId}/hqdefault.jpg`
      : first?.coverUrl || "";

  if (source) {
    try {
      const absolute = source.startsWith("http") ? source : `${getOrigin(_req)}${source}`;
      const res = await fetch(absolute, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const type = res.headers.get("content-type") ?? "image/jpeg";
        if (type.startsWith("image/")) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 0 && buf.length < 8_000_000) art = `data:${type};base64,${buf.toString("base64")}`;
        }
      }
    } catch {
      /* diseño sin imagen */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0c100b 0%, #19150f 55%, #0c0906 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: accent, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "66px 40px 60px 76px", width: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", width: 48, height: 48, alignItems: "center", justifyContent: "center", background: accent, color: "#0c0906", fontSize: 28, fontWeight: 900 }}>◎</div>
            <span style={{ fontSize: 21, letterSpacing: 6, color: "#f2e9da", fontWeight: 800 }}>ANTENA MUSICAL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ display: "flex", fontSize: 16, fontWeight: 800, letterSpacing: 4, color: accent }}>PLAYLIST PÚBLICA · {count} CANCIONES</span>
            <span style={{ display: "flex", fontSize: name.length > 24 ? 56 : 76, lineHeight: 1, fontWeight: 900, color: "#f2e9da" }}>
              {name.length > 38 ? `${name.slice(0, 38)}…` : name}
            </span>
            <span style={{ display: "flex", fontSize: 26, color: "#cbbda6" }}>
              {first ? `▶ ${first.title} · ${first.artistName}` : "Una mezcla para sonar sin parar"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "flex", padding: "10px 20px", border: `2px solid ${accent}`, color: accent, fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>AUTOMIX</span>
            <span style={{ display: "flex", fontSize: 19, color: "#b8ab97" }}>Modo TV · pantalla completa</span>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 64 }}>
          <div style={{ display: "flex", width: 430, height: 430, border: `6px solid ${accent}`, background: "#16120e", overflow: "hidden", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 70px rgba(0,0,0,.55)" }}>
            {art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art} alt="" width={430} height={430} style={{ width: 430, height: 430, objectFit: "cover" }} />
            ) : (
              <span style={{ display: "flex", color: accent, fontSize: 180, fontWeight: 900 }}>♫</span>
            )}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } }
  );
}

function getOrigin(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}
