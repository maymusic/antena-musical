import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, tracks } from "@/db/schema";
import { fakeFrequency } from "@/lib/parse";
import { getNowPlaying } from "@/lib/radio";
import { TopBar, Footer } from "@/components/Chrome";
import DialPanel, { type DialStation } from "@/components/DialPanel";
import LiveRadio from "@/components/LiveRadio";
import StationGrid from "@/components/StationGrid";
import Reveal from "@/components/Reveal";
import {
  IconAntenna,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconImage,
  IconLink,
  IconMapPin,
  IconMusic,
  IconRadio,
  IconSpotify,
  IconYoutube,
  PlatformChip,
  VuMeter,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const INCLUDED_IDAS = [
  { icon: IconMusic, title: "Tu biografía e historia", desc: "Orígenes, influencias, anécdotas: cuéntalo en tus palabras, con espacio de sobra." },
  { icon: IconImage, title: "Galería ilimitada con Google Drive", desc: "Fotos de directo, estudio, prensa y backstage desde tus enlaces públicos de Drive. ANTENA MUSICAL no almacena los archivos." },
  { icon: IconImage, title: "Reel de fotos a pantalla completa", desc: "Navega por tus fotos como en TikTok o Reels: una a una, a pantalla completa, con swipe o scroll." },
  { icon: IconYoutube, title: "Tus canciones de YouTube", desc: "Pega el enlace de cada video, corto o sesión. Nosotros lo metemos en la rotación." },
  { icon: IconSpotify, title: "Tus enlaces de Spotify", desc: "Pistas, álbumes o playlists: suenan dentro de tu cabina con el embed oficial." },
  { icon: IconRadio, title: "Radio en rotación continua", desc: "Un reproductor tipo emisora: tus pistas encadenadas, con ON AIR, oyentes y VU-meters." },
  { icon: IconCalendar, title: "Fechas de concierto", desc: "Anuncia tus próximos shows con recinto y ciudad, en formato cartelera." },
  { icon: IconLink, title: "Redes y contacto", desc: "Instagram, TikTok, YouTube, X, Bandcamp y email — un solo clic para encontrarte." },
  { icon: IconMapPin, title: "Identidad propia", desc: "Tu color de sintonía, tus géneros, tu ciudad y tu frecuencia en el dial. Nada de plantillas." },
];

const ROADMAP_IDAS = [
  "Tienda de merch, preventas y productos digitales",
  "Boletería e invitaciones para conciertos",
  "Blog / diario de gira con publicaciones del artista",
  "Rider técnico descargable para salas y festivales",
  "Podcasts, entrevistas y sesiones exclusivas",
  "Listas de fans curadas por el artista",
  "Colaboraciones cruzadas entre estaciones",
  "Dominios personalizados para cada artista",
  "Aplicación móvil / PWA con radio en segundo plano",
  "Estadísticas avanzadas por ciudad, fuente y minutos escuchados",
  "Solicitudes de canciones y votaciones de la audiencia",
  "Cuenta de fan sincronizada para guardar Mi dial en cualquier dispositivo",
];

export default async function Home() {
  const nowPlaying = await getNowPlaying();
  const stations = await db
    .select({
      id: artists.id,
      slug: artists.slug,
      name: artists.name,
      tagline: artists.tagline,
      genres: artists.genres,
      city: artists.city,
      coverUrl: artists.coverUrl,
      accent: artists.accent,
      trackCount: sql<number>`(select count(*) from tracks where tracks.artist_id = ${artists.id})`.as("track_count"),
      plays: sql<number>`(select coalesce(sum(plays), 0) from tracks where tracks.artist_id = ${artists.id})`.as("plays"),
      verificationStatus: artists.verificationStatus,
    })
    .from(artists)
    .orderBy(asc(artists.id));

  const allTracks = await db
    .select({
      title: tracks.title,
      platform: tracks.platform,
      artistId: tracks.artistId,
      artistName: artists.name,
      slug: artists.slug,
    })
    .from(tracks)
    .innerJoin(artists, sql`${tracks.artistId} = ${artists.id}`)
    .where(eq(artists.moderationStatus, "active"))
    .orderBy(asc(tracks.id))
    .limit(60);

  const byArtist = new Map<number, { title: string; platform: string }>();
  for (const t of allTracks) {
    if (!byArtist.has(t.artistId)) byArtist.set(t.artistId, { title: t.title, platform: t.platform });
  }

  const dialStations: DialStation[] = stations.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    freq: fakeFrequency(s.id),
    genres: s.genres,
    firstTrack: byArtist.get(s.id)?.title ?? null,
    firstPlatform: (byArtist.get(s.id)?.platform as "youtube" | "spotify") ?? null,
  }));

  const tickerItems = allTracks.slice(0, 24);
  const totalTracks = allTracks.length;

  return (
    <div className="min-h-screen">
      <TopBar />

      {/* ============ MASTHEAD ============ */}
      <section className="relative noise overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2.5 font-tech text-[11px] tracking-[0.3em] uppercase text-bone-dim border border-inkline bg-coal-2 px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-onair animate-pulse-dot" />
                Señal abierta · plataforma de radios de artista
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 font-display font-extrabold leading-[0.95] tracking-tight text-[clamp(2.6rem,7vw,5.2rem)]">
                Tu música,
                <br />
                tu propia
                <br />
                <span className="relative inline-block text-signal">
                  estación
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden>
                    <path d="M2 9c40-6 120-8 196-3" stroke="#FF4D00" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                de radio<span className="text-signal">.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 text-lg text-bone-dim max-w-xl leading-relaxed">
                ANTENA MUSICAL le da a cada artista su espacio en el dial: <strong className="text-bone font-semibold">tu biografía, tus fotos</strong> y{" "}
                <strong className="text-bone font-semibold">tus canciones de YouTube y Spotify</strong> sonando en cadena, como una
                emisora de verdad — en tiempo real, las 24 horas.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/crear"
                  className="inline-flex items-center gap-2.5 px-7 py-4 bg-signal text-coal font-display font-extrabold text-lg hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow"
                >
                  <IconAntenna className="w-5 h-5" /> Crear mi estación
                </Link>
                <a
                  href="#en-vivo"
                  className="inline-flex items-center gap-2.5 px-7 py-4 border border-bone/25 text-bone font-display font-bold text-lg hover:border-signal hover:text-signal transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-signal animate-blink" /> Escuchar en vivo
                </a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 font-tech text-[11px] tracking-[0.2em] uppercase text-bone-dim">
                <div>
                  <dt className="text-bone font-bold text-2xl tracking-normal font-display">{stations.length}</dt>
                  <dd>estaciones al aire</dd>
                </div>
                <div>
                  <dt className="text-bone font-bold text-2xl tracking-normal font-display">{totalTracks}</dt>
                  <dd>pistas en rotación</dd>
                </div>
                <div>
                  <dt className="text-bone font-bold text-2xl tracking-normal font-display">24/7</dt>
                  <dd>emisión continua</dd>
                </div>
              </dl>
            </Reveal>
          </div>
          <Reveal delay={200} className="relative">
            <div className="absolute -inset-6 border border-dashed border-inkline -z-10" aria-hidden />
            <DialPanel stations={dialStations} />
          </Reveal>
        </div>
      </section>

      {/* ============ TICKER ============ */}
      <div className="border-y border-inkline bg-coal-2 marquee-paused overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-0 py-3">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {tickerItems.length === 0 && (
                <span className="px-6 font-tech text-[11px] tracking-[0.25em] uppercase text-bone-dim">
                  La red está encendiendo sus transmisores…
                </span>
              )}
              {tickerItems.map((t, i) => (
                <span key={`${dup}-${i}`} className="flex items-center gap-3 px-6 font-tech text-[11px] tracking-[0.18em] uppercase whitespace-nowrap">
                  <span className="text-signal">▸</span>
                  <span className="text-bone-dim">Ahora en</span>
                  <Link href={`/${t.slug}`} className="text-bone hover:text-signal transition-colors font-bold">
                    {t.artistName}
                  </Link>
                  <span className="text-bone-dim">— {t.title}</span>
                  <PlatformChip platform={t.platform} className="w-3.5 h-3.5" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ EMISORA CENTRAL EN VIVO ============ */}
      <section id="en-vivo" className="mx-auto max-w-6xl px-4 pt-20 scroll-mt-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="flex items-center gap-2 font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> Emisión en directo · 24/7
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight">
              Antena Musical Central
            </h2>
            <p className="mt-3 text-bone-dim max-w-xl leading-relaxed">
              Todas las canciones que suben los artistas — sus enlaces de YouTube y Spotify — encadenadas en una sola
              parrilla continua. <strong className="text-bone">No eliges qué suena</strong>: entras justo en el segundo
              que va emitiendo, igual que una radio de verdad.
            </p>
          </div>
          <div className="border border-inkline bg-panel px-4 py-3">
            <p className="font-tech text-[9px] tracking-[0.3em] uppercase text-bone-dim mb-1">Parrilla actual</p>
            <p className="font-display font-extrabold text-2xl">
              {nowPlaying.totalSlots} <span className="font-tech font-normal text-xs text-bone-dim">pistas en bucle</span>
            </p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <LiveRadio initial={nowPlaying} />
        </Reveal>
      </section>

      {/* ============ DIRECTORIO ============ */}
      <section id="estaciones" className="mx-auto max-w-6xl px-4 pt-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Índice de la red</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight">Estaciones en el dial</h2>
          </div>
          <p className="font-tech text-[11px] tracking-widest uppercase text-bone-dim max-w-xs">
            Cada tarjeta es una emisora real: entra y pulsa «sintonizar».
          </p>
        </Reveal>

        {stations.length === 0 ? (
          <Reveal className="border border-dashed border-inkline p-14 text-center">
            <IconRadio className="w-10 h-10 text-bone-dim mx-auto mb-4" />
            <p className="font-display font-bold text-xl mb-2">El dial está en silencio</p>
            <p className="text-bone-dim mb-6">Sé la primera voz: crea tu estación y estrena la red.</p>
            <Link href="/crear" className="inline-flex items-center gap-2 px-6 py-3 bg-signal text-coal font-display font-bold hover:brightness-110 transition-all hard-shadow">
              Crear la primera estación <IconArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        ) : (
          <Reveal>
            <StationGrid
              stations={stations.map((s) => ({
                id: s.id,
                slug: s.slug,
                name: s.name,
                tagline: s.tagline,
                genres: s.genres,
                city: s.city,
                coverUrl: s.coverUrl,
                accent: s.accent,
                trackCount: s.trackCount,
                plays: s.plays,
                verified: s.verificationStatus === "approved",
              }))}
            />
          </Reveal>
        )}
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 pt-28">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Cadena de señal</p>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight">
            De tu sala de ensayo al dial en tres movimientos
          </h2>
        </Reveal>
        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-14 left-[12%] right-[12%] border-t-2 border-dashed border-inkline" aria-hidden />
          {[
            {
              n: "01",
              t: "Reclama tu frecuencia",
              d: "Elige nombre, URL, géneros y tu color de sintonía. Crea tu cuenta con email y contraseña: tu cabina estará disponible desde cualquier dispositivo.",
            },
            {
              n: "02",
              t: "Sube tu mundo",
              d: "Tu portada, tu avatar y una galería de imágenes. Escribe tu historia y pega tus redes. Es tu espacio: hazlo tuyo.",
            },
            {
              n: "03",
              t: "Sal al aire",
              d: "Pega los enlaces de tus canciones en YouTube y Spotify. Tu radio las encadena una tras otra, con cabina, ON AIR y oyentes en vivo.",
            },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 130} className={i === 1 ? "md:translate-y-10" : ""}>
              <div className="relative border border-inkline bg-panel p-6 hard-shadow hover:st-border transition-colors h-full">
                <span className="absolute -top-5 left-5 flex items-center justify-center w-11 h-11 bg-signal text-coal font-display font-extrabold text-lg hard-shadow">
                  {step.n}
                </span>
                <h3 className="mt-5 font-display font-extrabold text-2xl">{step.t}</h3>
                <p className="mt-3 text-sm text-bone-dim leading-relaxed">{step.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ IDEAS / QUÉ SUBIR ============ */}
      <section id="ideas" className="mx-auto max-w-6xl px-4 pt-28">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-12">
          <Reveal className="lg:sticky lg:top-28 self-start">
            <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Manual de emisión</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[1.02]">
              ¿Qué puedes subir a tu estación?
            </h2>
            <p className="mt-5 text-bone-dim leading-relaxed">
              La regla es simple: <strong className="text-bone">solo se suben imágenes</strong>. Tu música vive en YouTube y Spotify —
              aquí la enlazas y tu radio la emite. Todo lo demás es tu historia. Estas son las piezas que recomendamos
              para una estación completa:
            </p>
            <div className="mt-7 border border-inkline bg-panel p-5">
              <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim mb-3">Tip del ingeniero</p>
              <p className="text-sm leading-relaxed">
                «Una buena estación se presenta como un buen disco: <span className="text-signal font-semibold">portada que enganche</span>,{" "}
                <span className="text-signal font-semibold">historia que atrape</span> y{" "}
                <span className="text-signal font-semibold">música que no pare</span>. Empieza por tres fotos potentes y tu
                canción favorita.»
              </p>
            </div>
          </Reveal>

          <div className="space-y-3.5">
            {INCLUDED_IDAS.map((idea, i) => (
              <Reveal key={idea.title} delay={(i % 4) * 70}>
                <div className="group flex items-start gap-4 border border-inkline bg-panel px-5 py-4.5 hover:border-signal/60 hover:translate-x-1.5 transition-all">
                  <span className="mt-0.5 flex items-center justify-center w-10 h-10 border border-inkline bg-coal-2 text-signal shrink-0 group-hover:bg-signal group-hover:text-coal group-hover:border-signal transition-colors">
                    <idea.icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg leading-tight">{idea.title}</h3>
                    <p className="text-sm text-bone-dim mt-1 leading-relaxed">{idea.desc}</p>
                  </div>
                  <span className="hidden sm:flex items-center gap-1 shrink-0 mt-1 font-tech text-[9px] tracking-[0.2em] text-onair">
                    <IconCheck className="w-3.5 h-3.5" /> INCLUIDO
                  </span>
                </div>
              </Reveal>
            ))}

            <Reveal delay={120}>
              <div className="border border-dashed border-inkline px-5 py-5">
                <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-amber mb-3">En el taller · próximamente</p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {ROADMAP_IDAS.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm text-bone-dim">
                      <span className="w-1.5 h-1.5 bg-amber shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="mx-auto max-w-6xl px-4 pt-28">
        <Reveal>
          <div className="relative border border-inkline noise overflow-hidden">
            <div className="dial-face absolute inset-0 opacity-70" aria-hidden />
            <div className="relative px-6 py-16 md:px-16 md:py-20 text-center">
              <p className="font-tech text-[11px] tracking-[0.35em] uppercase text-amber mb-5">
                Frecuencia libre · sin costo · tu cuenta, tu cabina
              </p>
              <h2 className="font-display font-extrabold text-[clamp(2.2rem,5.5vw,4.2rem)] leading-[0.98] tracking-tight max-w-3xl mx-auto">
                Hay una frecuencia con tu nombre<span className="text-signal">.</span>
              </h2>
              <p className="mt-5 text-bone-dim max-w-xl mx-auto">
                Reclámala antes de que lo haga otro. Tres minutos y estás al aire.
              </p>
              <Link
                href="/crear"
                className="mt-9 inline-flex items-center gap-3 px-9 py-4.5 bg-signal text-coal font-display font-extrabold text-xl hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow"
              >
                <IconAntenna className="w-6 h-6" /> Crear mi estación
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
