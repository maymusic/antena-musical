"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NowPlaying, RadioSlot } from "@/lib/radio";
import { formatDuration } from "@/lib/parse";
import { getEmbedUrl } from "@/lib/embed";
import { loadYouTubeApi } from "@/lib/yt";
import {
  IconArrowRight,
  IconNext,
  IconPause,
  IconPlay,
  IconRadio,
  IconVolume,
  PlatformChip,
  VuMeter,
} from "./icons";

export default function LiveRadio({
  initial,
  compact = false,
}: {
  initial: NowPlaying;
  compact?: boolean;
}) {
  const [state, setState] = useState<NowPlaying>(initial);
  const [tuned, setTuned] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [elapsed, setElapsed] = useState(initial.offsetSec);
  const [clock, setClock] = useState("--:--:--");
  const [connecting, setConnecting] = useState(false);

  const playerRef = useRef<any>(null);
  const ytReadyRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tunedRef = useRef(false);
  const slotRef = useRef<number>(initial.slotIndex);
  const targetRef = useRef<{ id: number; offset: number } | null>(null);
  tunedRef.current = tuned;

  const current = state.current;
  const accent = current?.accent || "#FF4D00";

  /* ---------- reloj de emisión ---------- */
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-ES", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---------- barra de progreso local ---------- */
  useEffect(() => {
    setElapsed(state.offsetSec);
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [state.offsetSec, state.slotIndex]);

  /* ---------- carga del reproductor de YouTube ---------- */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player("antena-central-yt", {
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0, disablekb: 1 },
          events: {
            onReady: () => {
              ytReadyRef.current = true;
              playerRef.current?.setVolume?.(volume);
              const target = targetRef.current;
              if (target && tunedRef.current) {
                playerRef.current.loadVideoById({ videoId: String(target.id), startSeconds: target.offset });
              }
            },
            onStateChange: (e: any) => {
              if (e.data === YT.PlayerState.PLAYING) {
                setPlaying(true);
                setConnecting(false);
              }
              if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
              if (e.data === YT.PlayerState.ENDED) sync(true);
            },
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* noop */
      }
      playerRef.current = null;
      ytReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      playerRef.current?.setVolume?.(volume);
    } catch {
      /* noop */
    }
  }, [volume]);

  /* ---------- emitir la pista que toca, en el segundo que toca ---------- */
  const air = useCallback((next: NowPlaying, force = false) => {
    const slot = next.current;
    if (!slot) return;
    const changed = force || slot.trackId !== slotRef.current;
    if (changed) fetch(`/api/tracks/${slot.trackId}/play`, { method: "POST" }).catch(() => {});
    slotRef.current = slot.trackId;

    if (slot.platform === "youtube") {
      targetRef.current = { id: Number(slot.externalId) || 0, offset: Math.floor(next.offsetSec) };
      if (ytReadyRef.current && playerRef.current?.loadVideoById && (changed || force)) {
        playerRef.current.loadVideoById({
          videoId: slot.externalId,
          startSeconds: Math.floor(next.offsetSec),
        });
        playerRef.current.setVolume?.(volume);
        setConnecting(true);
      }
    } else {
      // Spotify: el embed no admite arranque a mitad, entra desde el inicio de la pista.
      try {
        playerRef.current?.stopVideo?.();
      } catch {
        /* noop */
      }
      setPlaying(true);
      setConnecting(false);
    }
  }, [volume]);

  /* ---------- sincronización con el servidor ---------- */
  const sync = useCallback(
    async (goLive = false) => {
      try {
        const res = await fetch("/api/radio/now", { cache: "no-store" });
        if (!res.ok) return;
        const next: NowPlaying = await res.json();
        setState(next);
        if (tunedRef.current) air(next, goLive);
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        advanceTimer.current = setTimeout(() => sync(true), Math.min(next.msToNext + 400, 15 * 60 * 1000));
      } catch {
        /* la red volverá */
      }
    },
    [air]
  );

  /* programa el salto a la siguiente pista + re-sincroniza cada 45 s */
  useEffect(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => sync(true), Math.min(state.msToNext + 400, 15 * 60 * 1000));
    const drift = setInterval(() => sync(false), 45000);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      clearInterval(drift);
    };
  }, [state.msToNext, state.slotIndex, sync]);

  /* ---------- controles ---------- */
  const tuneIn = async () => {
    setTuned(true);
    tunedRef.current = true;
    setConnecting(true);
    const res = await fetch("/api/radio/now", { cache: "no-store" }).catch(() => null);
    const next: NowPlaying = res && res.ok ? await res.json() : state;
    setState(next);
    air(next, true);
    if (next.current?.platform === "youtube") {
      setTimeout(() => {
        try {
          playerRef.current?.playVideo?.();
        } catch {
          /* noop */
        }
      }, 400);
    }
  };

  const toggle = () => {
    if (!tuned) return tuneIn();
    if (current?.platform === "youtube") {
      if (playing) {
        playerRef.current?.pauseVideo?.();
        setPlaying(false);
      } else {
        // al reanudar, volvemos al directo (no a donde se dejó)
        sync(true);
        playerRef.current?.playVideo?.();
        setPlaying(true);
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  const remaining = current ? Math.max(0, current.durationSec - elapsed) : 0;
  const pct = current ? Math.min(100, (elapsed / current.durationSec) * 100) : 0;

  if (!state.onAir || !current) {
    return (
      <div className="border border-inkline bg-panel hard-shadow p-8 text-center noise relative overflow-hidden">
        <IconRadio className="w-9 h-9 mx-auto text-bone-dim mb-3" />
        <p className="font-display font-bold text-xl mb-1">La emisora central está en silencio</p>
        <p className="text-sm text-bone-dim">
          Cuando los artistas añadan sus enlaces de YouTube y Spotify, sonarán aquí en cadena, 24/7.
        </p>
      </div>
    );
  }

  /* ---------- versión compacta (barra) ---------- */
  if (compact) {
    return (
      <div className="border border-inkline bg-panel" style={{ ["--st" as string]: accent }}>
        <div className="hidden" aria-hidden>
          <div id="antena-central-yt" />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={toggle} className="p-2.5 st-bg text-coal shrink-0 hover:brightness-110 transition-all">
            {playing ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4 translate-x-[1px]" />}
          </button>
          <VuMeter playing={playing} bars={4} />
          <div className="min-w-0 flex-1">
            <p className="font-tech text-[9px] tracking-[0.3em] uppercase text-bone-dim">ANTENA MUSICAL CENTRAL · EN VIVO</p>
            <p className="truncate text-sm font-semibold">
              {current.artistName} — {current.title}
            </p>
          </div>
          <span className="font-tech text-[10px] text-bone-dim tabular-nums hidden sm:block">-{formatDuration(remaining)}</span>
        </div>
      </div>
    );
  }

  /* ---------- consola completa ---------- */
  return (
    <div className="border border-inkline bg-panel hard-shadow noise relative overflow-hidden" style={{ ["--st" as string]: accent }}>
      {/* cabecera */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-inkline bg-coal-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <IconRadio className="w-4 h-4 st-text shrink-0" />
          <span className="font-tech text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-bone-dim truncate">
            Antena Musical Central · emisión continua de la red
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:flex items-center gap-1.5 font-tech text-[10px] tracking-widest text-bone-dim">
            {clock}
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 border border-signal text-signal font-tech text-[10px] tracking-[0.25em]">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> EN VIVO
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.45fr_1fr]">
        {/* pantalla */}
        <div className="border-b lg:border-b-0 lg:border-r border-inkline">
          <div className="relative aspect-video bg-black">
            {/* contenedor persistente de YouTube */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                tuned && current.platform === "youtube" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div id="antena-central-yt" className="w-full h-full" />
            </div>

            {tuned && current.platform !== "youtube" && (
              <iframe
                key={current.trackId}
                title={`${current.title} — ${current.platform}`}
                src={getEmbedUrl(current.platform, current.kind, current.externalId, true) ?? ""}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            )}

            {/* capa de sintonía */}
            {!tuned && (
              <button onClick={tuneIn} className="absolute inset-0 w-full group text-left">
                {current.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 kenburns" />
                ) : (
                  <div className="absolute inset-0 dial-face opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/50" />
                <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <span className="flex items-center justify-center w-20 h-20 rounded-full st-bg text-coal border-4 border-coal/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <IconPlay className="w-9 h-9 translate-x-0.5" />
                  </span>
                  <span className="font-display font-extrabold text-xl md:text-3xl leading-tight">
                    Sintonizar en directo
                  </span>
                  <span className="font-tech text-[11px] tracking-[0.22em] text-bone/80 uppercase max-w-sm">
                    Ahora suena «{current.title}» de {current.artistName} — entrarás en el minuto {formatDuration(state.offsetSec)}
                  </span>
                </div>
              </button>
            )}

            {connecting && tuned && (
              <div className="absolute inset-0 flex items-center justify-center bg-coal/70 pointer-events-none">
                <span className="font-tech text-[11px] tracking-[0.3em] uppercase text-bone animate-blink">
                  Enganchando la señal…
                </span>
              </div>
            )}
          </div>

          {/* lectura de la pista */}
          <div className="px-4 py-3 bg-coal-2 border-t border-inkline flex items-center gap-3">
            <VuMeter playing={playing} bars={7} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-tech text-[9px] tracking-[0.3em] uppercase text-bone-dim">Sonando ahora en la red</p>
              <div className="flex items-center gap-2 min-w-0">
                <PlatformChip platform={current.platform} />
                <p className="truncate font-display font-bold text-sm md:text-base">{current.title}</p>
              </div>
            </div>
            <Link
              href={`/${current.artistSlug}`}
              className="shrink-0 font-tech text-[10px] tracking-widest uppercase st-text hover:underline flex items-center gap-1"
            >
              {current.artistName} <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* transporte */}
          <div className="px-4 pb-4 pt-3 bg-coal-2 space-y-3">
            <div className="relative h-2 bg-coal border border-inkline">
              <div className="absolute inset-y-0 left-0 st-bg transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
              <div
                className="absolute inset-0 opacity-40"
                style={{ background: "repeating-linear-gradient(90deg, transparent 0 9%, rgba(0,0,0,.5) 9% calc(9% + 2px))" }}
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={toggle}
                className="p-3.5 st-bg text-coal hover:brightness-110 active:translate-y-0.5 transition-all"
                aria-label={playing ? "Pausar" : "Sintonizar"}
              >
                {playing ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5 translate-x-[1px]" />}
              </button>
              <button
                onClick={() => sync(true)}
                className="p-2.5 border border-inkline text-bone hover:st-border hover:st-text transition-colors"
                title="Volver al directo"
                aria-label="Volver al directo"
              >
                <IconNext className="w-4 h-4" />
              </button>
              <span className="font-tech text-[11px] text-bone-dim tabular-nums">
                {formatDuration(elapsed)} <span className="text-bone-dim/60">/ {formatDuration(current.durationSec)}</span>
              </span>

              <div className="flex items-center gap-2 ml-auto min-w-[120px] flex-1 max-w-[190px]">
                <IconVolume className="w-4 h-4 text-bone-dim shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="fader w-full"
                  style={{ ["--fill" as string]: `${volume}%` }}
                  aria-label="Volumen"
                />
              </div>
              <span className="flex items-center gap-1.5 font-tech text-[10px] tracking-widest uppercase text-bone-dim">
                <span className="w-1.5 h-1.5 rounded-full bg-onair animate-pulse-dot" /> {state.listeners} oyentes
              </span>
            </div>
            <p className="font-tech text-[9px] tracking-wider text-bone-dim">
              PARRILLA ▸ {state.totalSlots} pistas de la red en bucle ·{" "}
              {current.platform !== "youtube"
                ? "las pistas embebidas (Spotify, SoundCloud, Deezer) entran desde su inicio — el embed no permite saltar"
                : "estás escuchando en el mismo segundo que el resto de oyentes"}
            </p>
          </div>
        </div>

        {/* a continuación */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-inkline bg-coal-2">
            <h3 className="font-tech text-[11px] tracking-[0.25em] text-bone-dim uppercase">A continuación</h3>
            <span className="font-tech text-[10px] st-text">EN {formatDuration(remaining)}</span>
          </div>
          <ul className="flex-1">
            {state.upcoming.map((slot, i) => (
              <li key={`${slot.trackId}-${i}`}>
                <Link
                  href={`/${slot.artistSlug}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-inkline/60 hover:bg-coal-2 transition-colors group"
                >
                  <span className="font-tech text-[10px] text-bone-dim w-5 shrink-0 tabular-nums">{i + 1}</span>
                  <PlatformChip platform={slot.platform} className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm truncate group-hover:text-bone transition-colors">{slot.title}</span>
                    <span className="block font-tech text-[9px] tracking-widest uppercase text-bone-dim truncate">
                      {slot.artistName}
                    </span>
                  </span>
                  <span
                    className="w-1.5 h-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: slot.accent }}
                  />
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-inkline bg-coal-2">
            <p className="font-tech text-[9px] tracking-wider text-bone-dim leading-relaxed">
              La parrilla mezcla a todos los artistas de ANTENA MUSICAL. Sube tus enlaces y entrarás automáticamente en la rotación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
