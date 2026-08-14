import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { getBaseUrl } from "@/lib/baseurl";
import { formatDuration, isPlayable } from "@/lib/parse";
import { getEmbedUrl } from "@/lib/embed";
import { TopBar, Footer } from "@/components/Chrome";
import ShareButtons from "@/components/ShareButtons";
import BackgroundPlayButton from "@/components/BackgroundPlayButton";
import AddToPlaylistButton from "@/components/AddToPlaylistButton";
import Reveal from "@/components/Reveal";
import { IconArrowRight, IconVerified, PlatformChip, platformLabel } from "@/components/icons";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; trackId: string }> };

async function loadTrack(slug: string, trackId: string) {
  const id = Number(trackId);
  if (!Number.isFinite(id)) return null;

  const rows = await db
    .select({
      track: tracks,
      artist: artists,
    })
    .from(tracks)
    .innerJoin(artists, eq(tracks.artistId, artists.id))
    .where(and(eq(tracks.id, id), eq(artists.slug, slug), eq(artists.moderationStatus, "active")))
    .limit(1);

  return rows[0] ?? null;
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug, trackId } = await params;
  const row = await loadTrack(slug, trackId);
  if (!row) return { title: "Canción no encontrada" };

  const base = getBaseUrl();
  const { track, artist } = row;
  const url = `${base}/${slug}/cancion/${track.id}`;
  const og = `/api/og/track/${track.id}`;
  const description = `Escucha «${track.title}» de ${artist.name} en ANTENA MUSICAL — su radio online 24/7.`;

  return {
    title: `${track.title} — ${artist.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "music.song",
      title: `${track.title} — ${artist.name}`,
      description,
      url,
      siteName: "ANTENA MUSICAL",
      images: [{ url: og, width: 1200, height: 630, alt: `${track.title} — ${artist.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${track.title} — ${artist.name}`,
      description,
      images: [og],
    },
  };
}

export default async function TrackPage({ params }: Ctx) {
  const { slug, trackId } = await params;
  const row = await loadTrack(slug, trackId);
  if (!row) notFound();

  const { track, artist } = row;
  const verified = artist.verificationStatus === "approved";
  const embed = getEmbedUrl(track.platform, track.kind, track.externalId, false);
  const cover =
    track.platform === "youtube" ? `https://i.ytimg.com/vi/${track.externalId}/hqdefault.jpg` : artist.coverUrl;

  const siblings = await db
    .select()
    .from(tracks)
    .where(eq(tracks.artistId, artist.id))
    .orderBy(asc(tracks.position), asc(tracks.id));

  const queue = siblings
    .filter((t) => t.platform === "youtube" && t.externalId)
    .map((t) => ({ id: t.id, title: t.title, externalId: t.externalId }));
  const startIndex = Math.max(0, queue.findIndex((q) => q.id === track.id));
  const others = siblings.filter((t) => t.id !== track.id).slice(0, 6);

  return (
    <div className="min-h-screen pb-24" style={{ ["--st" as string]: artist.accent }}>
      <TopBar solid />

      <main className="mx-auto max-w-5xl px-4 pt-10">
        <Reveal>
          <Link
            href={`/${artist.slug}`}
            className="inline-flex items-center gap-2 font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim hover:st-text transition-colors mb-6"
          >
            ← Volver a {artist.name}
          </Link>
        </Reveal>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
          {/* Reproductor principal */}
          <Reveal>
            <div className="neon-panel overflow-hidden hard-shadow">
              <div className="relative aspect-video bg-black">
                {embed ? (
                  <iframe
                    title={track.title}
                    src={embed}
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 0 }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={track.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 dial-face" />
                )}
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformChip platform={track.platform} />
                  <span className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim">
                    {platformLabel(track.platform)}
                  </span>
                  {track.featured ? <span className="featured-chip">Destacada</span> : null}
                  {isPlayable(track.platform) && (
                    <span className="font-tech text-[9px] tracking-[0.25em] uppercase text-onair">· en rotación</span>
                  )}
                </div>

                <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight leading-[1.05]">
                  {track.title}
                </h1>

                <Link href={`/${artist.slug}`} className="inline-flex items-center gap-2 group">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full st-bg text-coal font-display font-extrabold shrink-0">
                    {artist.name[0]}
                  </span>
                  <span>
                    <span className="flex items-center gap-1.5 font-display font-bold group-hover:st-text transition-colors">
                      {artist.name}
                      {verified && <IconVerified className="w-4 h-4" />}
                    </span>
                    <span className="block font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                      {artist.city || "ANTENA MUSICAL"} · {formatDuration(track.durationSec)}
                    </span>
                  </span>
                </Link>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {queue.length > 0 && (
                    <BackgroundPlayButton
                      tracks={queue}
                      artistName={artist.name}
                      artistSlug={artist.slug}
                      accent={artist.accent}
                      startIndex={startIndex}
                    />
                  )}
                  <AddToPlaylistButton trackId={track.id} trackTitle={track.title} accent={artist.accent} />
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim hover:st-text transition-colors"
                  >
                    Abrir en {platformLabel(track.platform)} ↗
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Lateral */}
          <div className="space-y-5">
            <Reveal delay={80}>
              <div className="neon-panel p-5">
                <p className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title mb-3">Comparte esta canción</p>
                <p className="text-sm text-bone-dim mb-4 leading-relaxed">
                  El enlace lleva directo a esta canción, con su portada y el nombre de {artist.name}.
                </p>
                <ShareButtons title={`${track.title} — ${artist.name}`} accent={artist.accent} />
              </div>
            </Reveal>

            {track.lyrics && (
              <Reveal delay={120}>
                <div className="neon-panel p-5">
                  <p className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title mb-3">Letra</p>
                  <pre className="font-body text-[15px] leading-relaxed whitespace-pre-wrap text-bone/90 max-h-80 overflow-y-auto">
                    {track.lyrics}
                  </pre>
                </div>
              </Reveal>
            )}

            {others.length > 0 && (
              <Reveal delay={160}>
                <div className="neon-panel p-5">
                  <p className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title mb-3">
                    Más de {artist.name}
                  </p>
                  <ul className="space-y-1.5">
                    {others.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/${artist.slug}/cancion/${t.id}`}
                          className="flex items-center gap-2.5 px-2 py-2 hover:bg-coal-2 transition-colors group"
                        >
                          <PlatformChip platform={t.platform} />
                          <span className="flex-1 min-w-0 truncate text-sm group-hover:st-text transition-colors">
                            {t.title}
                          </span>
                          {t.featured ? <span className="featured-chip">★</span> : null}
                          <IconArrowRight className="w-3.5 h-3.5 text-bone-dim shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
