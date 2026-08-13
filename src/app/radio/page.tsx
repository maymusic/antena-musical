import type { Metadata } from "next";
import Link from "next/link";
import { getNowPlaying, getSchedule, GAP_SEC } from "@/lib/radio";
import { formatDuration } from "@/lib/parse";
import { TopBar, Footer } from "@/components/Chrome";
import LiveRadio from "@/components/LiveRadio";
import Reveal from "@/components/Reveal";
import { IconArrowRight, IconSpotify, IconYoutube } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Antena Musical Central — radio en directo 24/7",
  description:
    "La emisora de la red ANTENA MUSICAL: todas las canciones de todos los artistas, en YouTube y Spotify, sonando en cadena y en tiempo real.",
};

export default async function RadioPage() {
  const [nowPlaying, schedule] = await Promise.all([getNowPlaying(), getSchedule()]);
  const cycleMin = Math.round(nowPlaying.cycleSec / 60);
  const artistCount = new Set(schedule.map((s) => s.artistId)).size;

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-8">
        <Reveal className="mb-8">
          <p className="flex items-center gap-2 font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> On air · sin pausa
          </p>
          <h1 className="font-display font-extrabold text-[clamp(2.6rem,7vw,4.8rem)] tracking-tight leading-[0.95]">
            Antena Musical Central<span className="text-signal">.</span>
          </h1>
          <p className="mt-5 text-lg text-bone-dim max-w-2xl leading-relaxed">
            Una sola emisora para toda la red: las canciones que cada artista enlaza desde{" "}
            <strong className="text-bone">YouTube</strong> y <strong className="text-bone">Spotify</strong> entran
            automáticamente en la parrilla y suenan en cadena. La emisión está sincronizada con el reloj del servidor,
            así que todos los oyentes escuchan lo mismo al mismo tiempo.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <LiveRadio initial={nowPlaying} />
        </Reveal>

        <Reveal delay={140} className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { k: "Pistas en la parrilla", v: String(nowPlaying.totalSlots) },
            { k: "Artistas en rotación", v: String(artistCount) },
            { k: "Duración del ciclo", v: `${cycleMin} min` },
          ].map((s) => (
            <div key={s.k} className="border border-inkline bg-panel px-5 py-4">
              <p className="font-display font-extrabold text-3xl">{s.v}</p>
              <p className="font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mt-1">{s.k}</p>
            </div>
          ))}
        </Reveal>

        {/* PARRILLA COMPLETA */}
        {schedule.length > 0 && (
          <section className="mt-16">
            <Reveal className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-2">Programación</p>
                <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">La parrilla completa</h2>
              </div>
              <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim max-w-xs">
                Orden fijo, en bucle · {GAP_SEC}s de aire entre pistas
              </p>
            </Reveal>
            <div className="border border-inkline divide-y divide-inkline">
              {schedule.map((slot, i) => {
                const live = i === nowPlaying.slotIndex;
                return (
                  <Reveal key={slot.trackId} delay={Math.min(i, 8) * 40}>
                    <Link
                      href={`/${slot.artistSlug}`}
                      className={`flex items-center gap-4 px-4 py-3.5 transition-colors group ${
                        live ? "bg-coal-3" : "bg-panel hover:bg-coal-2"
                      }`}
                      style={{ ["--st" as string]: slot.accent }}
                    >
                      <span className="font-tech text-[10px] text-bone-dim w-7 shrink-0 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {slot.platform === "youtube" ? (
                        <IconYoutube className="w-4 h-4 text-signal shrink-0" />
                      ) : (
                        <IconSpotify className="w-4 h-4 text-onair shrink-0" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className={`block truncate font-semibold ${live ? "st-text" : ""}`}>{slot.title}</span>
                        <span className="block font-tech text-[9px] tracking-widest uppercase text-bone-dim truncate">
                          {slot.artistName}
                        </span>
                      </span>
                      {live && (
                        <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-signal text-signal font-tech text-[9px] tracking-[0.25em] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> AL AIRE
                        </span>
                      )}
                      <span className="font-tech text-[10px] text-bone-dim tabular-nums shrink-0">
                        {formatDuration(slot.durationSec)}
                      </span>
                      <IconArrowRight className="w-4 h-4 text-bone-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        <Reveal className="mt-14">
          <div className="relative border border-inkline noise overflow-hidden">
            <div className="dial-face absolute inset-0 opacity-60" aria-hidden />
            <div className="relative px-6 py-12 md:px-12 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-amber mb-2">¿Quieres sonar aquí?</p>
                <h3 className="font-display font-extrabold text-2xl md:text-4xl tracking-tight">
                  Sube tus enlaces y entras en la parrilla<span className="text-signal">.</span>
                </h3>
              </div>
              <Link
                href="/crear"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-signal text-coal font-display font-extrabold text-lg hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow shrink-0"
              >
                Crear mi estación <IconArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
