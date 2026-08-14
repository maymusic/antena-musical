import type { Metadata } from "next";
import Link from "next/link";
import { listPublicPlaylists } from "@/lib/playlists";
import { TopBar, Footer } from "@/components/Chrome";
import Reveal from "@/components/Reveal";
import { IconAntenna, IconArrowRight, IconPlay } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Playlists públicas — ANTENA MUSICAL",
  description:
    "Mezclas creadas por los oyentes con canciones de artistas independientes. Escúchalas en modo radio con automezcla y pantalla completa.",
};

export default async function PublicPlaylistsPage() {
  const playlists = await listPublicPlaylists();

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-16">
        <Reveal className="max-w-3xl">
          <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Mezclas de la comunidad</p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.98]">
            Playlists públicas<span className="text-signal">.</span>
          </h1>
          <p className="mt-5 text-lg text-bone-dim leading-relaxed">
            Listas creadas por oyentes con canciones de artistas de la red. Entra en cualquiera y déjala sonando:
            tiene <strong className="text-bone">automezcla</strong> y <strong className="text-bone">modo TV</strong> a pantalla completa.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/mis-playlists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-signal text-coal font-display font-bold hover:brightness-110 transition-all hard-shadow"
            >
              Crear mi playlist <IconArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/radio"
              className="inline-flex items-center gap-2 px-6 py-3 border border-bone/25 text-bone font-display font-bold hover:border-signal hover:text-signal transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-signal animate-blink" /> Antena Central
            </Link>
          </div>
        </Reveal>

        {playlists.length === 0 ? (
          <Reveal delay={100}>
            <div className="mt-12 border border-dashed border-inkline p-14 text-center">
              <IconAntenna className="w-10 h-10 text-bone-dim mx-auto mb-4" />
              <p className="font-display font-bold text-xl mb-2">Todavía no hay playlists públicas</p>
              <p className="text-bone-dim text-sm mb-6 max-w-md mx-auto">
                Crea la tuya, añade canciones de tus artistas favoritos y pulsa «Publicar» para que aparezca aquí.
              </p>
              <Link
                href="/mis-playlists"
                className="inline-flex items-center gap-2 px-6 py-3 bg-signal text-coal font-display font-bold hover:brightness-110 transition-all hard-shadow"
              >
                Crear la primera <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <Link
                  href={`/playlists/${p.id}`}
                  className="group block border border-inkline bg-panel hard-shadow hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full"
                  style={{ ["--st" as string]: p.accent }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-coal-2">
                    {p.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full dial-face flex items-center justify-center">
                        <span className="font-display font-extrabold text-6xl st-text">{p.name[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-coal via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 featured-chip">● Pública</span>
                    <span className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-9 h-9 st-bg text-coal shrink-0">
                        <IconPlay className="w-4 h-4 translate-x-[1px]" />
                      </span>
                      <span className="font-tech text-[10px] tracking-widest uppercase text-bone/90">
                        {p.trackCount} canciones
                      </span>
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-display font-extrabold text-xl group-hover:st-text transition-colors truncate">
                      {p.name}
                    </h2>
                    {p.firstTitle && (
                      <p className="mt-1 text-sm text-bone-dim truncate">
                        ▶ {p.firstTitle}
                        {p.firstArtist ? ` · ${p.firstArtist}` : ""}
                      </p>
                    )}
                    {p.description && (
                      <p className="mt-2 text-xs text-bone-dim/80 line-clamp-2">{p.description}</p>
                    )}
                    <p className="mt-3 font-tech text-[9px] tracking-[0.25em] uppercase st-text">
                      Escuchar con automezcla →
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
