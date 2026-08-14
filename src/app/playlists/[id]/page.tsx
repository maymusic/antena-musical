import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/baseurl";
import { getPublicPlaylistDetail } from "@/lib/playlists";
import { formatDuration } from "@/lib/parse";
import { TopBar, Footer } from "@/components/Chrome";
import WinampPlayer, { type WinampTrack } from "@/components/WinampPlayer";
import ShareButtons from "@/components/ShareButtons";
import Reveal from "@/components/Reveal";
import { IconArrowRight, IconPlay, PlatformChip } from "@/components/icons";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { id } = await params;
  const playlistId = Number(id);
  const detail = Number.isFinite(playlistId) ? await getPublicPlaylistDetail(playlistId) : null;
  if (!detail) return { title: "Playlist no encontrada" };

  const base = getBaseUrl();
  const title = `${detail.playlist.name} — Playlist pública`;
  const description = detail.playlist.description || `Escucha ${detail.items.length} canciones en esta playlist pública de ANTENA MUSICAL.`;
  const url = `${base}/playlists/${detail.playlist.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "ANTENA MUSICAL",
      images: [{ url: `/api/og/playlist/${detail.playlist.id}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/playlist/${detail.playlist.id}`],
    },
  };
}

export default async function PublicPlaylistPage({ params }: Ctx) {
  const { id } = await params;
  const playlistId = Number(id);
  const detail = Number.isFinite(playlistId) ? await getPublicPlaylistDetail(playlistId) : null;
  if (!detail) notFound();

  const { playlist, items } = detail;
  const winampTracks: WinampTrack[] = items
    .filter((item) => item.platform === "youtube" && item.externalId)
    .map((item) => ({
      trackId: item.trackId,
      title: item.title,
      artistName: item.artistName,
      externalId: item.externalId,
      durationSec: item.durationSec,
      accent: item.accent || "#FF4D00",
    }));

  const accent = winampTracks[0]?.accent || "#FF4D00";

  return (
    <div className="min-h-screen" style={{ ["--st" as string]: accent }}>
      <TopBar solid />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-16">
        <Reveal>
          <Link
            href="/playlists"
            className="inline-flex items-center gap-2 font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim hover:st-text transition-colors mb-7"
          >
            ← Mis playlists
          </Link>
          <p className="font-tech text-[11px] tracking-[0.32em] uppercase neon-title mb-3">Playlist pública · Antena Musical</p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.95]">
            {playlist.name}
          </h1>
          <p className="mt-4 max-w-2xl text-bone-dim leading-relaxed">
            {playlist.description || `${items.length} canciones seleccionadas para sonar en modo radio.`}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="featured-chip">● Pública</span>
            <span className="font-tech text-[10px] tracking-widest uppercase text-bone-dim">{items.length} canciones · {winampTracks.length} en automix</span>
            <ShareButtons title={`${playlist.name} — Playlist pública en ANTENA MUSICAL`} accent={accent} />
          </div>
        </Reveal>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)] gap-8 items-start">
          <Reveal delay={80}>
            {winampTracks.length > 0 ? (
              <WinampPlayer tracks={winampTracks} playlistName={playlist.name} />
            ) : (
              <div className="neon-panel p-10 text-center text-bone-dim">
                Esta playlist todavía no tiene canciones de YouTube para el automix.
              </div>
            )}

            <div className="mt-4 border border-inkline bg-coal-2 p-4">
              <p className="font-tech text-[10px] tracking-[0.24em] uppercase neon-title mb-2">Modo TV</p>
              <p className="text-sm text-bone-dim leading-relaxed">
                Pulsa <strong className="text-bone">⛶</strong> en el mezclador para abrir pantalla completa. Con <strong className="text-bone">AUTOMIX</strong> encendido, encadena las pistas de YouTube y puedes dejarlo sonando en una TV.
              </p>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="neon-panel overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-inkline bg-coal-2">
                <h2 className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title">Lista de emisión</h2>
                <span className="font-tech text-[10px] text-bone-dim">{items.length} temas</span>
              </div>
              {items.length === 0 ? (
                <p className="p-8 text-center text-sm text-bone-dim">Esta playlist está vacía.</p>
              ) : (
                <ol className="divide-y divide-inkline max-h-[520px] overflow-y-auto">
                  {items.map((item, i) => (
                    <li key={item.itemId} className="flex items-center gap-3 px-4 py-3 hover:bg-coal-2 transition-colors">
                      <span className="font-tech text-[10px] text-bone-dim tabular-nums w-5">{String(i + 1).padStart(2, "0")}</span>
                      <PlatformChip platform={item.platform} />
                      <span className="min-w-0 flex-1">
                        <Link href={`/${item.artistSlug}/cancion/${item.trackId}`} className="block truncate text-sm font-semibold hover:st-text transition-colors">
                          {item.title}
                        </Link>
                        <Link href={`/${item.artistSlug}`} className="block truncate font-tech text-[9px] tracking-widest uppercase text-bone-dim hover:st-text">
                          {item.artistName}
                        </Link>
                      </span>
                      <span className="font-tech text-[9px] text-bone-dim">{formatDuration(item.durationSec)}</span>
                      <Link href={`/${item.artistSlug}/cancion/${item.trackId}`} aria-label={`Escuchar ${item.title}`} className="text-bone-dim hover:st-text">
                        <IconPlay className="w-4 h-4" />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
              <div className="border-t border-inkline p-4 text-center">
                <Link href="/crear" className="inline-flex items-center gap-2 font-tech text-[10px] tracking-[0.2em] uppercase neon-muted hover:neon-title">
                  Crea tu propia radio <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
