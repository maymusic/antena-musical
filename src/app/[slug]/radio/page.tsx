import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { fakeFrequency } from "@/lib/parse";
import { Footer } from "@/components/Chrome";
import RadioDeck from "@/components/RadioDeck";
import Reveal from "@/components/Reveal";
import { IconAntenna, IconArrowRight, IconVerified, PlatformChip, platformLabel, VuMeter } from "@/components/icons";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const rows = await db.select({ name: artists.name }).from(artists).where(eq(artists.slug, slug)).limit(1);
  if (!rows[0]) return { title: "Radio no encontrada — ANTENA MUSICAL" };
  return {
    title: `Radio online de ${rows[0].name} — 24/7 · ANTENA MUSICAL`,
    description: `La estación de radio online de ${rows[0].name}: su música en rotación continua, sin cortes.`,
  };
}

export default async function ArtistRadioPage({ params }: Ctx) {
  const { slug } = await params;
  const rows = await db.select().from(artists).where(and(eq(artists.slug, slug), eq(artists.moderationStatus, "active"))).limit(1);
  const artist = rows[0];
  if (!artist) notFound();

  const stationTracks = await db
    .select()
    .from(tracks)
    .where(eq(tracks.artistId, artist.id))
    .orderBy(asc(tracks.position), asc(tracks.id));

  const freq = fakeFrequency(artist.id);
  const initialListeners = 8 + ((artist.id * 37) % 90);
  const playableCount = stationTracks.filter((t) => ["youtube", "spotify", "soundcloud", "deezer"].includes(t.platform)).length;

  return (
    <div className="min-h-screen pb-20" style={{ ["--st" as string]: artist.accent }}>
      {/* barra mínima */}
      <header className="sticky top-0 z-[70] border-b border-inkline bg-coal/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="flex items-center justify-center w-8 h-8 bg-signal text-coal group-hover:rotate-[-6deg] transition-transform">
              <IconAntenna className="w-4.5 h-4.5" />
            </span>
            <span className="font-display font-extrabold tracking-tight hidden sm:block">ANTENA MUSICAL</span>
          </Link>
          <span className="font-tech text-[10px] tracking-widest text-bone-dim truncate">/{artist.slug}/radio</span>
          <div className="ml-auto flex items-center gap-3">
            <a
              href={`/${artist.slug}`}
              className="inline-flex items-center gap-1.5 font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:st-text transition-colors"
            >
              Estación completa <IconArrowRight className="w-3 h-3" />
            </a>
            <span className="flex items-center gap-1.5 px-2 py-1 border border-signal text-signal font-tech text-[10px] tracking-[0.25em]">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> 24/7
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-10">
        {/* cabecera */}
        <Reveal className="mb-8">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim">
            <span className="st-text">Estación de radio online</span>
            <span className="text-amber tabular-nums">{freq} MHz</span>
            <span className="flex items-center gap-1.5">
              <VuMeter playing bars={5} /> emisión continua
            </span>
          </p>
          <h1 className="mt-3 font-display font-extrabold tracking-tight leading-[0.95] text-[clamp(2.4rem,7vw,4.8rem)]">
            La radio de
            <br />
            <span className="st-text">
              {artist.name}
              {artist.verificationStatus === "approved" && (
                <span className="inline-flex align-middle ml-3" title="Perfil verificado por ANTENA MUSICAL">
                  <IconVerified className="w-6 h-6 md:w-9 md:h-9 drop-shadow" />
                </span>
              )}
            </span>
          </h1>
          <p className="mt-4 text-bone-dim max-w-xl">
            {playableCount > 0
              ? "Pulsa «sintonizar» y su música suena en cadena, sola, sin cortes. Comparte este enlace: es tu radio online, 24/7."
              : "Aún no hay pistas reproducibles — añade enlaces de YouTube, Spotify, SoundCloud o Deezer desde el panel de control."}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <RadioDeck
            tracks={stationTracks}
            artistId={artist.id}
            artistName={artist.name}
            accent={artist.accent}
            coverUrl={artist.coverUrl}
            initialListeners={initialListeners}
          />
        </Reveal>

        {/* enlaces externos */}
        {stationTracks.some((t) => !["youtube", "spotify", "soundcloud", "deezer"].includes(t.platform)) && (
          <Reveal delay={120} className="mt-8">
            <div className="border border-inkline bg-panel p-5">
              <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim mb-3">
                Escucha externa · Apple Music, Bandcamp, Tidal, Amazon y más
              </p>
              <div className="flex flex-wrap gap-2">
                {stationTracks
                  .filter((t) => !["youtube", "spotify", "soundcloud", "deezer"].includes(t.platform))
                  .map((t) => (
                    <a
                      key={t.id}
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 border border-inkline bg-coal-2 text-sm hover:st-border hover:st-text transition-colors"
                    >
                      <PlatformChip platform={t.platform} className="w-3.5 h-3.5" />
                      <span className="truncate max-w-56">{t.title}</span>
                      <span className="font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                        {platformLabel(t.platform)} ↗
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`/${artist.slug}`}
            className="inline-flex items-center gap-2 px-5 py-3 border border-bone/25 text-bone font-display font-bold hover:st-border hover:st-text transition-colors"
          >
            Volver a la estación completa
          </Link>
          <Link
            href={`/${artist.slug}/presskit`}
            className="inline-flex items-center gap-2 px-5 py-3 border border-inkline text-bone-dim font-tech text-[10px] tracking-[0.2em] uppercase hover:text-bone hover:border-bone/40 transition-colors"
          >
            ⬇ Press kit
          </Link>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
