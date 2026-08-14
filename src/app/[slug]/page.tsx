import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, images, shows, tracks } from "@/db/schema";
import { fakeFrequency, formatDate, isPlayable } from "@/lib/parse";
import { normalizeGoogleDriveFile } from "@/lib/drivefile";
import { getBaseUrl } from "@/lib/baseurl";
import { Footer } from "@/components/Chrome";
import RadioDeck from "@/components/RadioDeck";
import Gallery from "@/components/Gallery";
import PhotoReel from "@/components/PhotoReel";
import VideoGrid from "@/components/VideoGrid";
import NotifyBell from "@/components/NotifyBell";
import BackgroundPlayButton from "@/components/BackgroundPlayButton";
import ShareButtons from "@/components/ShareButtons";
import FavButton from "@/components/FavButton";
import AddToPlaylistButton from "@/components/AddToPlaylistButton";
import ChatPanel from "@/components/ChatPanel";
import Reveal from "@/components/Reveal";
import {
  IconAntenna,
  IconArrowRight,
  IconCalendar,
  IconMapPin,
  IconPlay,
  IconVerified,
  PlatformChip,
  platformLabel,
  socialHref,
  socialIcon,
  VuMeter,
} from "@/components/icons";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

async function getStation(slug: string) {
  const rows = await db.select().from(artists).where(and(eq(artists.slug, slug), eq(artists.moderationStatus, "active"))).limit(1);
  const artist = rows[0];
  if (!artist) return null;
  const [stationTracks, stationImages, stationShows] = await Promise.all([
    db.select().from(tracks).where(eq(tracks.artistId, artist.id)).orderBy(asc(tracks.position), asc(tracks.id)),
    db.select().from(images).where(eq(images.artistId, artist.id)).orderBy(asc(images.position), asc(images.id)),
    db.select().from(shows).where(eq(shows.artistId, artist.id)).orderBy(asc(shows.showDate)),
  ]);
  return { artist, stationTracks, stationImages, stationShows };
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const station = await getStation(slug);
  if (!station) return { title: "Estación no encontrada — ANTENA MUSICAL" };
  const { artist } = station;
  const base = getBaseUrl();
  const stationUrl = `${base}/${artist.slug}`;
  // Tarjeta generada por nosotros: funciona aunque la foto viva en Google Drive.
  const ogImage = `${base}/api/og/${artist.slug}`;
  const description =
    artist.tagline ||
    `${artist.genres.slice(0, 3).join(", ")}${artist.city ? ` desde ${artist.city}` : ""}. Escucha su radio online 24/7 en Antena Musical.`;

  return {
    metadataBase: new URL(base),
    title: `${artist.name} — ANTENA MUSICAL`,
    description,
    alternates: { canonical: stationUrl },
    openGraph: {
      title: `${artist.name} — su radio online en ANTENA MUSICAL`,
      description,
      type: "profile",
      url: stationUrl,
      siteName: "Antena Musical",
      locale: "es_ES",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${artist.name} en Antena Musical` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${artist.name} — ANTENA MUSICAL`,
      description,
      images: [ogImage],
    },
  };
}

export default async function StationPage({ params }: Ctx) {
  const { slug } = await params;
  const station = await getStation(slug);
  if (!station) notFound();

  const { artist, stationTracks, stationImages, stationShows } = station;
  const freq = fakeFrequency(artist.id);
  const initialListeners = 8 + ((artist.id * 37) % 90);
  const hasYoutube = stationTracks.some((t) => t.platform === "youtube");
  const hasSpotify = stationTracks.some((t) => t.platform === "spotify");
  const socialEntries = Object.entries(artist.socials).filter(([, v]) => v && v.trim());
  const upcomingShows = stationShows.filter((s) => new Date(s.showDate).getTime() > Date.now() - 86400000);
  const memberSince = new Date(artist.createdAt).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
  const isVerified = artist.verificationStatus === "approved";
  const driveKit = artist.presskitUrl ? normalizeGoogleDriveFile(artist.presskitUrl) : null;
  // Solo YouTube puede sonar en segundo plano sin que el navegador lo bloquee.
  const backgroundQueue = stationTracks
    .filter((t) => t.platform === "youtube")
    .map((t) => ({ id: t.id, title: t.title, externalId: t.externalId }));
  const youtubeVideos = stationTracks.filter((t) => t.platform === "youtube");
  const lyricTracks = stationTracks.filter((t) => t.lyrics.trim().length > 0);
  const latestTrackId = stationTracks.reduce((max, t) => Math.max(max, t.id), 0);
  const topTracks = [...stationTracks].sort((a, b) => b.plays - a.plays).slice(0, 5);
  const maxPlays = Math.max(1, ...topTracks.map((t) => t.plays));

  const googleCalUrl = (s: (typeof stationShows)[number]) => {
    const start = new Date(s.showDate);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${artist.name} en vivo — ${s.venue}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      location: [s.venue, s.city].filter(Boolean).join(", "),
      details: `Concierto anunciado en la estación ANTENA MUSICAL de ${artist.name}.`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ ["--st" as string]: artist.accent }}>
      {/* barra superior */}
      <header className="sticky top-0 z-[70] border-b border-inkline bg-coal/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="flex items-center justify-center w-8 h-8 bg-signal text-coal group-hover:rotate-[-6deg] transition-transform">
              <IconAntenna className="w-4.5 h-4.5" />
            </span>
            <span className="font-display font-extrabold tracking-tight hidden sm:block">ANTENA MUSICAL</span>
          </Link>
          <span className="font-tech text-[10px] tracking-widest text-bone-dim truncate">/{artist.slug}</span>
          <div className="ml-auto flex items-center gap-3">
            <a
              href={`/${artist.slug}/editar`}
              className="font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:st-text transition-colors hidden sm:block"
            >
              Panel de control
            </a>
            <a
              href="#radio"
              className="inline-flex items-center gap-2 px-4 py-2 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all"
            >
              <IconPlay className="w-3.5 h-3.5" /> Sintonizar
            </a>
          </div>
        </div>
      </header>

      {/* ============ IDENT DE ESTACIÓN ============ */}
      <section className="relative overflow-hidden noise border-b border-inkline">
        <div className="absolute inset-0">
          {artist.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artist.coverUrl} alt="" className="w-full h-full object-cover kenburns" />
          ) : (
            <div className="w-full h-full dial-face" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-coal/70 via-coal/80 to-coal" />
        </div>

        {/* padding superior extra en móvil para que la barra sticky (h-14)
            nunca pise el encabezado de la estación */}
        <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-10 md:pt-20 md:pb-14">
          <Reveal>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-tech text-[10px] tracking-[0.3em] uppercase text-bone/80">
              <span className="flex items-center gap-1.5 px-2 py-1 border border-bone/25 bg-coal/60">
                <span className="w-1.5 h-1.5 rounded-full bg-onair animate-pulse-dot" /> ON AIR
              </span>
              <span className="text-amber tabular-nums">{freq} MHz</span>
              {artist.city && (
                <span className="flex items-center gap-1">
                  <IconMapPin className="w-3 h-3" /> {artist.city}
                </span>
              )}
              <span className="hidden md:inline text-bone/60">en la red ANTENA MUSICAL desde {memberSince}</span>
            </p>
          </Reveal>
          <div className="mt-6 flex flex-col md:flex-row md:items-end gap-6">
            <Reveal delay={80} className="flex-1 min-w-0">
              <div className="flex items-end gap-5">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 st-border bg-coal-2 shrink-0 hard-shadow">
                  {artist.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-display font-extrabold text-4xl md:text-5xl st-text">
                      {artist.name[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-extrabold tracking-tight leading-[0.92] text-[clamp(2.6rem,8vw,5.5rem)]">
                    {artist.name}
                    {isVerified && (
                      <span className="inline-flex align-middle ml-3" title="Perfil verificado por ANTENA MUSICAL">
                        <IconVerified className="w-7 h-7 md:w-10 md:h-10 drop-shadow" />
                      </span>
                    )}
                  </h1>
                </div>
              </div>
              {isVerified && (
                <p className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#4DA6FF]/50 bg-[#4DA6FF]/10 font-tech text-[9px] tracking-[0.25em] uppercase text-[#4DA6FF]">
                  <IconVerified className="w-3.5 h-3.5" /> Perfil verificado
                </p>
              )}
              {artist.tagline && (
                <p className="mt-4 text-lg md:text-xl text-bone/85 font-medium max-w-2xl">«{artist.tagline}»</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {artist.genres.slice(0, 6).map((g) => (
                  <span key={g} className="px-2.5 py-1 border st-border bg-coal/70 font-tech text-[10px] tracking-[0.2em] uppercase">
                    {g}
                  </span>
                ))}
                {artist.genres.length > 6 && (
                  <span className="px-2.5 py-1 border border-inkline bg-coal/70 font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim">
                    +{artist.genres.length - 6}
                  </span>
                )}
                <span className="flex items-center gap-2 ml-1">
                  <VuMeter playing bars={6} />
                  <span className="font-tech text-[10px] tracking-widest uppercase text-bone/70">emisión continua</span>
                </span>
              </div>
            </Reveal>
            <Reveal delay={160} className="shrink-0">
              {/* en móvil los botones se apilan a todo lo ancho; en escritorio quedan en columna lateral */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3 md:flex-col md:flex-nowrap">
                <a
                  href="#radio"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 st-bg text-coal font-display font-extrabold text-lg hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow"
                >
                  <IconPlay className="w-5 h-5" /> Escuchar la radio
                </a>
                <BackgroundPlayButton
                  tracks={backgroundQueue}
                  artistName={artist.name}
                  artistSlug={artist.slug}
                  accent={artist.accent}
                />
                <NotifyBell
                  artistId={artist.id}
                  artistName={artist.name}
                  artistSlug={artist.slug}
                  latestTrackId={latestTrackId}
                  accent={artist.accent}
                />
                <a
                  href={`/${artist.slug}/radio`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-bone/25 bg-coal/60 text-bone font-tech text-[10px] tracking-[0.2em] uppercase hover:st-border hover:st-text transition-colors"
                >
                  📻 Modo radio (página completa)
                </a>
                <a
                  href={`/${artist.slug}/presskit`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-bone/25 bg-coal/60 text-bone font-tech text-[10px] tracking-[0.2em] uppercase hover:st-border hover:st-text transition-colors"
                >
                  ⬇ Press kit (PDF)
                </a>
                {driveKit && (
                  <a
                    href={driveKit.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border st-border bg-coal/60 st-text font-tech text-[10px] tracking-[0.2em] uppercase hover:brightness-125 transition-all"
                    title={artist.presskitLabel || "Press kit del artista"}
                  >
                    ⬇ {artist.presskitLabel || "Press kit del artista"}
                  </a>
                )}
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <FavButton artistId={artist.id} slug={artist.slug} name={artist.name} accent={artist.accent} />
                    <ShareButtons title={artist.name} accent={artist.accent} />
                  </div>
                {socialEntries.length > 0 && (
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    {socialEntries.map(([key, value]) => (
                      <a
                        key={key}
                        href={socialHref(key, value)}
                        target="_blank"
                        rel="noreferrer"
                        title={key}
                        className="p-2.5 border border-bone/25 bg-coal/60 text-bone hover:st-border hover:st-text transition-colors"
                      >
                        {socialIcon(key, "w-4 h-4")}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CABINA / RADIO ============ */}
      <section id="radio" className="mx-auto max-w-6xl px-4 pt-12 scroll-mt-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">Cabina de emisión</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">La radio de {artist.name}</h2>
          </div>
          <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim max-w-xs">
            {stationTracks.length} pistas · YouTube + Spotify · rotación sin cortes
          </p>
        </Reveal>
        <Reveal delay={100}>
          <RadioDeck
            tracks={stationTracks}
            artistId={artist.id}
            artistName={artist.name}
            accent={artist.accent}
            coverUrl={artist.coverUrl}
            initialListeners={initialListeners}
          />
        </Reveal>
      </section>

      {/* ============ TODA MI MÚSICA ============ */}
      {stationTracks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <Reveal className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">Discografía enlazada</p>
              <h3 className="font-display font-extrabold text-2xl">Toda mi música</h3>
            </div>
            <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim max-w-sm">
              Todos los links del artista · los de YouTube, Spotify, SoundCloud y Deezer también suenan en la rotación
            </p>
          </Reveal>
          <Reveal delay={60}>
            <ul className="border border-inkline divide-y divide-inkline grid sm:grid-cols-2 gap-0">
              {stationTracks.map((t) => (
                <li key={t.id} className="sm:odd:border-r border-b border-inkline sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-3 bg-panel hover:bg-coal-2 transition-colors group h-full">
                    <PlatformChip platform={t.platform} />
                    <Link href={`/${artist.slug}/cancion/${t.id}`} className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="block text-sm font-semibold truncate group-hover:st-text transition-colors">
                          {t.title}
                        </span>
                        {t.featured ? <span className="featured-chip shrink-0">Destacada</span> : null}
                      </span>
                      <span className="block font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                        {platformLabel(t.platform)}
                        {isPlayable(t.platform) && <span className="text-onair"> · en rotación</span>}
                      </span>
                    </Link>
                    <AddToPlaylistButton trackId={t.id} trackTitle={t.title} accent={artist.accent} />
                    <a href={t.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${t.title}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-bone-dim group-hover:st-text transition-colors shrink-0">
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* ============ HISTORIA + FICHA ============ */}
      {(artist.bio || socialEntries.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-20 grid lg:grid-cols-[1.7fr_1fr] gap-10">
          {artist.bio && (
            <Reveal>
              <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-4">Historia</p>
              <div className="text-[17px] leading-relaxed text-bone/90 whitespace-pre-line first-letter:font-display first-letter:font-extrabold first-letter:text-6xl first-letter:float-left first-letter:mr-3 first-letter:leading-[0.8] first-letter:st-text">
                {artist.bio}
              </div>
            </Reveal>
          )}
          <Reveal delay={120}>
            <div className="border border-inkline bg-panel hard-shadow">
              <p className="px-5 py-3 border-b border-inkline bg-coal-2 font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim">
                Ficha técnica
              </p>
              <dl className="divide-y divide-inkline text-sm">
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">Frecuencia</dt>
                  <dd className="font-tech text-amber tabular-nums">{freq} MHz</dd>
                </div>
                {artist.city && (
                  <div className="flex justify-between gap-4 px-5 py-3.5">
                    <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">Base</dt>
                    <dd className="text-right">{artist.city}</dd>
                  </div>
                )}
                {artist.genres.length > 0 && (
                  <div className="flex justify-between gap-4 px-5 py-3.5">
                    <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">Géneros</dt>
                    <dd className="text-right">{artist.genres.join(" · ")}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">Rotación</dt>
                  <dd className="text-right">{stationTracks.length} pistas</dd>
                </div>
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">En la red</dt>
                  <dd className="text-right capitalize">{memberSince}</dd>
                </div>
                {driveKit && (
                  <div className="flex justify-between gap-4 px-5 py-3.5">
                    <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">Press kit</dt>
                    <dd className="text-right">
                      <a href={driveKit.downloadUrl} target="_blank" rel="noreferrer" className="st-text hover:underline font-semibold">
                        {driveKit.kind === "folder" ? "Abrir carpeta ↗" : "Descargar ⬇"}
                      </a>
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim pt-0.5">Verificación</dt>
                  <dd className="text-right flex items-center justify-end gap-1.5">
                    {isVerified ? (
                      <span className="flex items-center gap-1.5 text-[#4DA6FF] font-semibold">
                        <IconVerified className="w-4 h-4" /> Verificado
                      </span>
                    ) : (
                      <span className="text-bone-dim">No verificado</span>
                    )}
                  </dd>
                </div>
              </dl>
              {(hasYoutube || hasSpotify) && (
                <div className="px-5 py-4 border-t border-inkline flex flex-wrap gap-2.5">
                  {hasYoutube && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-signal/15 border border-signal/50 text-signal font-tech text-[10px] tracking-widest">
                      <PlatformChip platform="youtube" className="w-3.5 h-3.5" /> SUENA VÍA YOUTUBE
                    </span>
                  )}
                  {hasSpotify && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-onair/10 border border-onair/50 text-onair font-tech text-[10px] tracking-widest">
                      <PlatformChip platform="spotify" className="w-3.5 h-3.5" /> SUENA VÍA SPOTIFY
                    </span>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ VIDEOTECA ============ */}
      {youtubeVideos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">Videoteca</p>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Los videos</h2>
            </div>
            <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim">
              {youtubeVideos.length} videos de YouTube · clic para reproducir aquí mismo
            </p>
          </Reveal>
          <Reveal delay={100}>
            <VideoGrid videos={youtubeVideos} accent={artist.accent} />
          </Reveal>
        </section>
      )}

      {/* ============ LETRAS ============ */}
      {lyricTracks.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <Reveal className="mb-6">
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">Cancionero</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Letras destacadas</h2>
          </Reveal>
          <div className="space-y-3">
            {lyricTracks.map((t, i) => (
              <Reveal key={t.id} delay={i * 70}>
                <details className="group border border-inkline bg-panel open:st-border transition-colors">
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none select-none">
                    <span className="font-tech text-[10px] text-bone-dim tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 font-display font-bold group-open:st-text transition-colors">{t.title}</span>
                    <span className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim group-open:hidden">
                      Ver letra +
                    </span>
                    <span className="font-tech text-[9px] tracking-[0.25em] uppercase st-text hidden group-open:inline">
                      Cerrar −
                    </span>
                  </summary>
                  <div className="px-5 pb-6 pt-2 border-t border-inkline">
                    <pre className="font-body text-[15px] leading-relaxed whitespace-pre-wrap text-bone/90 max-w-xl">
                      {t.lyrics}
                    </pre>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============ ESTADÍSTICAS PÚBLICAS ============ */}
      {topTracks.length > 0 && topTracks[0].plays > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <Reveal className="mb-6">
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">Medidor de audiencia</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Lo más sonado</h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="border border-inkline bg-panel p-6 space-y-4">
              {topTracks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-4">
                  <span className="font-display font-extrabold text-2xl st-text w-8 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <span className="font-tech text-[10px] text-bone-dim tabular-nums shrink-0">
                        {t.plays.toLocaleString("es")} reproducciones
                      </span>
                    </div>
                    <div className="h-2 bg-coal border border-inkline overflow-hidden">
                      <div
                        className="h-full st-bg transition-all duration-700"
                        style={{ width: `${Math.max(4, (t.plays / maxPlays) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ GALERÍA ============ */}
      {stationImages.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">Archivo visual</p>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">La galería</h2>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim">
                {stationImages.length} imágenes
              </p>
              <span className="w-px h-4 bg-inkline" />
              <PhotoReel images={stationImages} accent={artist.accent} />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Gallery images={stationImages} accent={artist.accent} />
          </Reveal>
        </section>
      )}

      {/* ============ FECHAS ============ */}
      {upcomingShows.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20">
          <Reveal className="mb-6">
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">En vivo</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Próximas emisiones</h2>
          </Reveal>
          <div className="space-y-3">
            {upcomingShows.map((s, i) => {
              const f = formatDate(s.showDate);
              return (
                <Reveal key={s.id} delay={i * 80}>
                  <div className="flex flex-wrap items-center gap-4 border border-inkline bg-panel px-5 py-4 hover:st-border transition-colors group">
                    <div className="text-center shrink-0 w-16 border st-border bg-coal py-2">
                      <span className="block font-display font-extrabold text-2xl leading-none st-text">{f.day}</span>
                      <span className="block font-tech text-[9px] tracking-widest text-bone-dim mt-0.5">
                        {f.month} · {f.year}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-lg truncate group-hover:st-text transition-colors">{s.venue}</p>
                      {s.city && (
                        <p className="flex items-center gap-1.5 font-tech text-[10px] tracking-widest uppercase text-bone-dim">
                          <IconMapPin className="w-3 h-3" /> {s.city}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={googleCalUrl(s)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-inkline font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim hover:st-border hover:st-text transition-colors"
                        title="Añadir a Google Calendar"
                      >
                        <IconCalendar className="w-3.5 h-3.5" /> Google
                      </a>
                      <a
                        href={`/api/shows/${s.id}/ics`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-inkline font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim hover:st-border hover:st-text transition-colors"
                        title="Descargar .ics (Apple / Outlook)"
                      >
                        ⬇ .ICS
                      </a>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ============ CONTRATACIONES + CRÉDITOS ============ */}
      {(artist.phone || artist.booking || artist.credits.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-20 grid lg:grid-cols-2 gap-8">
          {(artist.phone || artist.booking || artist.socials.email) && (
            <Reveal>
              <div className="border border-inkline bg-panel hard-shadow h-full">
                <p className="px-5 py-3 border-b border-inkline bg-coal-2 font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim">
                  Contacto y contrataciones
                </p>
                <div className="p-6 space-y-4">
                  {artist.phone && (
                    <a
                      href={`tel:${artist.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-4 group"
                    >
                      <span className="flex items-center justify-center w-11 h-11 border border-inkline bg-coal-2 st-text group-hover:st-bg group-hover:text-coal transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.8.7a2 2 0 0 1 1.7 2z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim">Teléfono directo</p>
                        <p className="font-display font-bold text-lg group-hover:st-text transition-colors">{artist.phone}</p>
                      </div>
                    </a>
                  )}
                  {artist.socials.email && (
                    <a href={`mailto:${artist.socials.email}`} className="flex items-center gap-4 group">
                      <span className="flex items-center justify-center w-11 h-11 border border-inkline bg-coal-2 st-text group-hover:st-bg group-hover:text-coal transition-colors">
                        {socialIcon("email", "w-5 h-5")}
                      </span>
                      <div>
                        <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim">Email</p>
                        <p className="font-display font-bold text-lg group-hover:st-text transition-colors break-all">
                          {artist.socials.email}
                        </p>
                      </div>
                    </a>
                  )}
                  {artist.booking && (
                    <div className="border-t border-inkline pt-4">
                      <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim mb-1.5">Booking / management</p>
                      <p className="text-sm text-bone/90 leading-relaxed">{artist.booking}</p>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {artist.credits.length > 0 && (
            <Reveal delay={100}>
              <div className="border border-inkline bg-panel hard-shadow h-full">
                <p className="px-5 py-3 border-b border-inkline bg-coal-2 font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim">
                  Colaboraciones y créditos
                </p>
                <dl className="divide-y divide-inkline">
                  {artist.credits.map((c, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                      <dt className="font-tech text-[10px] tracking-widest uppercase text-bone-dim shrink-0">{c.role}</dt>
                      <dd className="text-sm text-right">{c.name}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          )}
        </section>
      )}

      {/* ============ CHAT DE LA ESTACIÓN ============ */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <Reveal className="mb-6">
          <p className="font-tech text-[11px] tracking-[0.3em] uppercase st-text mb-2">En la sala</p>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Chat en vivo</h2>
        </Reveal>
        <Reveal delay={80}>
          <ChatPanel artistId={artist.id} artistName={artist.name} accent={artist.accent} />
        </Reveal>
      </section>

      {/* ============ CTA CREAR ============ */}
      <section className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal>
          <div className="relative border border-inkline noise overflow-hidden">
            <div className="dial-face absolute inset-0 opacity-60" aria-hidden />
            <div className="relative px-6 py-12 md:px-12 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-amber mb-2">¿Tocas, cantas o produces?</p>
                <h3 className="font-display font-extrabold text-2xl md:text-4xl tracking-tight">
                  Esta podría ser tu estación<span className="st-text">.</span>
                </h3>
              </div>
              <Link
                href="/crear"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 st-bg text-coal font-display font-extrabold text-lg hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow shrink-0"
              >
                <IconAntenna className="w-5 h-5" /> Crear la mía <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
