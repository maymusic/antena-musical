import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, images, shows, tracks } from "@/db/schema";
import { formatDate } from "@/lib/parse";
import PrintButton from "@/components/PrintButton";
import { IconAntenna, socialHref } from "@/components/icons";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Press kit — ${slug} · ANTENA MUSICAL` };
}

export default async function PressKitPage({ params }: Ctx) {
  const { slug } = await params;
  const rows = await db.select().from(artists).where(and(eq(artists.slug, slug), eq(artists.moderationStatus, "active"))).limit(1);
  const artist = rows[0];
  if (!artist) notFound();

  const [artistImages, artistTracks, artistShows] = await Promise.all([
    db.select().from(images).where(eq(images.artistId, artist.id)).orderBy(asc(images.position), asc(images.id)).limit(6),
    db.select().from(tracks).where(eq(tracks.artistId, artist.id)).orderBy(asc(tracks.position), asc(tracks.id)),
    db.select().from(shows).where(eq(shows.artistId, artist.id)).orderBy(asc(shows.showDate)),
  ]);

  const socialEntries = Object.entries(artist.socials).filter(([, v]) => v && v.trim());
  const upcoming = artistShows.filter((s) => new Date(s.showDate).getTime() > Date.now() - 86400000);

  return (
    <div className="min-h-screen bg-white text-neutral-900 print:bg-white">
      {/* Barra superior — no se imprime */}
      <div className="bg-coal text-bone px-6 py-4 flex flex-wrap items-center gap-4 print:hidden">
        <Link href={`/${artist.slug}`} className="flex items-center gap-2 font-display font-bold hover:text-signal transition-colors">
          <span className="flex items-center justify-center w-8 h-8 bg-signal text-coal">
            <IconAntenna className="w-4 h-4" />
          </span>
          ← Volver a la estación
        </Link>
        <p className="font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim flex-1">
          Press kit oficial · usa «Guardar como PDF» en el diálogo de impresión
        </p>
        <PrintButton label="Descargar PDF" />
      </div>

      {/* Documento */}
      <div className="mx-auto max-w-3xl px-8 py-12 print:py-6">
        {/* Cabecera */}
        <header className="border-b-4 pb-8 mb-8" style={{ borderColor: artist.accent }}>
          <p className="font-tech text-[10px] tracking-[0.4em] uppercase text-neutral-500 mb-3">
            PRESS KIT · {new Date().getFullYear()} · RED ANTENA MUSICAL
          </p>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl tracking-tight leading-none">
            {artist.name}
          </h1>
          {artist.verificationStatus === "approved" && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#2f7cd1]">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4DA6FF] text-white text-xs">✓</span>
              Perfil verificado por ANTENA MUSICAL
            </p>
          )}
          {artist.tagline && <p className="mt-3 text-xl text-neutral-600 italic">«{artist.tagline}»</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
            {artist.city && <span>📍 {artist.city}</span>}
            {artist.genres.length > 0 && <span>🎵 {artist.genres.join(" · ")}</span>}
            <span>📻 antenamusical.com/{artist.slug}</span>
          </div>
        </header>

        {/* Foto principal */}
        {artist.coverUrl && (
          <div className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artist.coverUrl} alt={artist.name} className="w-full aspect-video object-cover" />
          </div>
        )}

        {/* Bio */}
        {artist.bio && (
          <section className="mb-10">
            <h2 className="font-display font-extrabold text-2xl mb-3 pb-2 border-b border-neutral-200">Biografía</h2>
            <div className="text-[15px] leading-relaxed whitespace-pre-line text-neutral-800">{artist.bio}</div>
          </section>
        )}

        {/* Galería */}
        {artistImages.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-extrabold text-2xl mb-3 pb-2 border-b border-neutral-200">Fotos de prensa</h2>
            <div className="grid grid-cols-3 gap-3">
              {artistImages.map((img) => (
                <figure key={img.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.caption || "Foto"} className="w-full aspect-[4/3] object-cover" />
                  {img.caption && <figcaption className="mt-1 text-[10px] text-neutral-500">{img.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          {/* Música */}
          {artistTracks.length > 0 && (
            <section>
              <h2 className="font-display font-extrabold text-2xl mb-3 pb-2 border-b border-neutral-200">Música</h2>
              <ul className="space-y-1.5 text-sm">
                {artistTracks.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-baseline gap-2">
                    <span className="font-bold" style={{ color: artist.accent }}>▸</span>
                    <span className="flex-1">{t.title}</span>
                    <span className="text-[10px] uppercase text-neutral-400">{t.platform}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Créditos */}
          {artist.credits.length > 0 && (
            <section>
              <h2 className="font-display font-extrabold text-2xl mb-3 pb-2 border-b border-neutral-200">Créditos</h2>
              <ul className="space-y-1.5 text-sm">
                {artist.credits.map((c, i) => (
                  <li key={i}>
                    <span className="font-bold">{c.role}:</span> {c.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Fechas */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-extrabold text-2xl mb-3 pb-2 border-b border-neutral-200">Próximas fechas</h2>
            <ul className="space-y-1.5 text-sm">
              {upcoming.map((s) => {
                const f = formatDate(s.showDate);
                return (
                  <li key={s.id}>
                    <span className="font-bold tabular-nums">{f.day} {f.month} {f.year}</span> — {s.venue}
                    {s.city && `, ${s.city}`}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Contacto */}
        <section className="border-t-4 pt-6" style={{ borderColor: artist.accent }}>
          <h2 className="font-display font-extrabold text-2xl mb-3">Contacto y contrataciones</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              {artist.phone && (
                <p><span className="font-bold">Teléfono:</span> {artist.phone}</p>
              )}
              {artist.booking && (
                <p><span className="font-bold">Booking:</span> {artist.booking}</p>
              )}
              {artist.socials.email && (
                <p><span className="font-bold">Email:</span> {artist.socials.email}</p>
              )}
            </div>
            {socialEntries.length > 0 && (
              <div className="space-y-1.5">
                {socialEntries.filter(([k]) => k !== "email").map(([key, value]) => (
                  <p key={key}>
                    <span className="font-bold capitalize">{key}:</span>{" "}
                    <a href={socialHref(key, value)} className="underline" style={{ color: artist.accent }}>
                      {value}
                    </a>
                  </p>
                ))}
              </div>
            )}
          </div>
          <p className="mt-8 text-[10px] tracking-[0.3em] uppercase text-neutral-400">
            Generado por ANTENA MUSICAL — la red de radios de artista · antenamusical.com/{artist.slug}
          </p>
        </section>
      </div>
    </div>
  );
}
