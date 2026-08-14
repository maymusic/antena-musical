"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/db/schema";
import { formatDuration, isPlayable } from "@/lib/parse";
import { getEmbedUrl } from "@/lib/embed";
import { loadYouTubeApi } from "@/lib/yt";
import {
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconShuffle,
  IconVolume,
  PlatformChip,
  platformLabel,
  VuMeter,
} from "./icons";

export default function RadioDeck({
  tracks,
  artistId,
  artistName,
  accent,
  coverUrl,
  initialListeners,
}: {
  tracks: Track[];
  artistId: number;
  artistName: string;
  accent: string;
  coverUrl: string;
  initialListeners: number;
}) {
  /**
   * Modo continuo: solo YouTube suena solo de verdad.
   * Spotify, SoundCloud y Deezer usan iframes que los navegadores NO dejan
   * arrancar sin que el oyente pulse ▶ dentro del propio reproductor.
   */
  const [autoOnly, setAutoOnly] = useState(true);

  const embeddable = useMemo(() => tracks.filter((t) => isPlayable(t.platform)), [tracks]);
  const autoPlayable = useMemo(() => embeddable.filter((t) => t.platform === "youtube"), [embeddable]);
  const hasAuto = autoPlayable.length > 0;
  const playable = autoOnly && hasAuto ? autoPlayable : embeddable;
  const manualCount = embeddable.length - autoPlayable.length;

  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState({ cur: 0, dur: 0 });
  const [listeners, setListeners] = useState(initialListeners);
  const [clock, setClock] = useState("--:--:--");
  const [ytReady, setYtReady] = useState(false);
  const [started, setStarted] = useState(false);
  /** Pista pendiente de sonar tras ampliar la rotación a los embeds. */
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const playerRef = useRef<any>(null);
  const iframeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const iframeEndsAt = useRef<number>(0);
  const shuffleRef = useRef(shuffle);
  const indexRef = useRef<number | null>(null);
  shuffleRef.current = shuffle;
  indexRef.current = index;

  const current = index !== null ? playable[index] : null;
  const isYoutube = current?.platform === "youtube";
  const isIframe = !!current && current.platform !== "youtube";

  /* ------- reloj + oyentes ------- */
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-ES", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setListeners((n) => {
        const drift = Math.round((Math.random() - 0.42) * 5);
        return Math.max(3, n + drift);
      });
    }, 4200);
    return () => clearInterval(id);
  }, []);

  /* ------- YouTube player ------- */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(`yt-target-${artistId}`, {
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            setYtReady(true);
            playerRef.current?.setVolume(volume);
          },
          onStateChange: (e: any) => {
            if (e.data === YT.PlayerState.ENDED) {
              advance(1, true);
            } else if (e.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
            } else if (e.data === YT.PlayerState.PAUSED) {
              setPlaying((p) => (indexRef.current !== null && playable[indexRef.current]?.platform === "youtube" ? false : p));
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* noop */
      }
      playerRef.current = null;
      setYtReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  useEffect(() => {
    try {
      playerRef.current?.setVolume?.(volume);
    } catch {
      /* noop */
    }
  }, [volume]);

  /* ------- progreso ------- */
  useEffect(() => {
    const id = setInterval(() => {
      const i = indexRef.current;
      if (i === null) return;
      const t = playable[i];
      if (!t) return;
      if (t.platform === "youtube" && playerRef.current?.getCurrentTime) {
        try {
          setProgress({
            cur: playerRef.current.getCurrentTime() || 0,
            dur: playerRef.current.getDuration() || 0,
          });
        } catch {
          /* noop */
        }
      } else if (t.platform !== "youtube") {
        const remaining = Math.max(0, (iframeEndsAt.current - Date.now()) / 1000);
        setProgress({ cur: t.durationSec - remaining, dur: t.durationSec });
      }
    }, 500);
    return () => clearInterval(id);
  }, [playable]);

  const clearIframeTimer = () => {
    if (iframeTimer.current) {
      clearInterval(iframeTimer.current);
      iframeTimer.current = null;
    }
  };

  const pickNext = useCallback(
    (from: number, dir: 1 | -1): number => {
      if (playable.length <= 1) return from;
      if (shuffleRef.current) {
        let n = from;
        while (n === from) n = Math.floor(Math.random() * playable.length);
        return n;
      }
      return (from + dir + playable.length) % playable.length;
    },
    [playable.length]
  );

  const playAt = useCallback(
    (i: number) => {
      const t = playable[i];
      if (!t) return;
      setIndex(i);
      setStarted(true);
      clearIframeTimer();
      fetch(`/api/tracks/${t.id}/play`, { method: "POST" }).catch(() => {});
      if (t.platform === "youtube") {
        setProgress({ cur: 0, dur: 0 });
        if (playerRef.current?.loadVideoById) {
          playerRef.current.loadVideoById(t.externalId);
          playerRef.current.setVolume?.(volume);
        }
      } else {
        // Embed (Spotify / SoundCloud / Deezer): iframe con autoplay + avance automático.
        try {
          playerRef.current?.stopVideo?.();
        } catch {
          /* noop */
        }
        setProgress({ cur: 0, dur: t.durationSec });
        iframeEndsAt.current = Date.now() + t.durationSec * 1000;
        setPlaying(true);
        iframeTimer.current = setInterval(() => {
          if (Date.now() >= iframeEndsAt.current) {
            clearIframeTimer();
            const nextI = pickNext(i, 1);
            playAtRef.current(nextI);
          }
        }, 500);
      }
      setListeners((n) => n + 1 + Math.floor(Math.random() * 3));
    },
    [playable, volume, pickNext]
  );
  const playAtRef = useRef(playAt);
  playAtRef.current = playAt;

  /**
   * Reproduce una pista incrustable que ahora mismo está fuera de la rotación
   * (pasa con Spotify cuando está activo el modo «sin cortes»).
   * En vez de mandar al oyente a otra pestaña, ampliamos la rotación para
   * incluir los embeds y sonamos la pista aquí dentro.
   */
  const playEmbeddable = useCallback(
    (t: Track) => {
      const inRotation = playable.indexOf(t);
      if (inRotation !== -1) {
        playAtRef.current(inRotation);
        return;
      }
      setAutoOnly(false);
      const target = embeddable.indexOf(t);
      if (target !== -1) setPendingIndex(target);
    },
    [playable, embeddable]
  );

  /* Al ampliar la rotación, arrancamos la pista que pidió el oyente. */
  useEffect(() => {
    if (pendingIndex === null || autoOnly) return;
    playAtRef.current(pendingIndex);
    setPendingIndex(null);
  }, [pendingIndex, autoOnly]);

  const advance = useCallback(
    (dir: 1 | -1, auto = false) => {
      const from = indexRef.current ?? (dir === 1 ? -1 : 0);
      const nextI = pickNext(Math.max(0, from), dir);
      if (auto && indexRef.current === null) return;
      playAtRef.current(nextI);
    },
    [pickNext]
  );

  const togglePlay = () => {
    if (current === null) {
      if (playable.length > 0) playAt(0);
      return;
    }
    if (isYoutube && playerRef.current) {
      if (playing) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
      setPlaying(!playing);
    } else if (current && current.platform !== "youtube") {
      // Los embeds no se pueden pausar programáticamente: se desmontan al pausar
      // y vuelven a arrancar desde su inicio al reanudar.
      if (playing) {
        clearIframeTimer();
        setPlaying(false);
      } else {
        const remaining = Math.max(5, (iframeEndsAt.current - Date.now()) / 1000);
        iframeEndsAt.current = Date.now() + remaining * 1000;
        iframeTimer.current = setInterval(() => {
          if (Date.now() >= iframeEndsAt.current) {
            clearIframeTimer();
            const nextI = pickNext(indexRef.current ?? 0, 1);
            playAtRef.current(nextI);
          }
        }, 500);
        setPlaying(true);
      }
    }
  };

  useEffect(() => () => clearIframeTimer(), []);

  const pct = progress.dur > 0 ? Math.min(100, (progress.cur / progress.dur) * 100) : 0;

  return (
    <div style={{ ["--st" as string]: accent }}>
      {/* ============ CONSOLA ============ */}
      <section id="radio" className="relative border border-inkline bg-panel hard-shadow noise overflow-hidden">
        {/* top strip */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-inkline bg-coal-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full knurl border border-inkline" />
            <span className="font-tech text-[10px] md:text-[11px] tracking-[0.22em] text-bone-dim uppercase">
              Cabina de emisión · {artistName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 font-tech text-[10px] tracking-widest text-bone-dim">
              HORA LOCAL <span className="text-bone tabular-nums">{clock}</span>
            </span>
            <span
              className={`flex items-center gap-1.5 px-2 py-1 border font-tech text-[10px] tracking-[0.25em] ${
                playing
                  ? "border-[var(--st)] text-[var(--st)]"
                  : "border-inkline text-bone-dim"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${playing ? "st-bg animate-blink" : "bg-inkline"}`}
              />
              {playing ? "ON AIR" : "EN ESPERA"}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr]">
          {/* pantalla */}
          <div className="relative border-b lg:border-b-0 lg:border-r border-inkline">
            <div className="relative aspect-video bg-black">
              {/*
                El div interior lo reemplaza la IFrame API de YouTube por su
                <iframe>. El encuadre lo pone `.yt-screen` (el contenedor),
                que sobrevive a esa sustitución: sin esto el video se veía negro.
              */}
              <div
                className={`yt-screen transition-opacity duration-500 ${
                  current?.platform === "youtube" && started
                    ? "opacity-100 z-10"
                    : "opacity-0 -z-10 pointer-events-none"
                }`}
              >
                <div id={`yt-target-${artistId}`} />
              </div>
              {current && isIframe && started && (
                <div className="absolute inset-0 z-20 flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber text-coal shrink-0">
                    <span className="font-tech text-[10px] tracking-[0.2em] uppercase font-bold">
                      ▶ Pulsa play dentro del panel de {platformLabel(current.platform)}
                    </span>
                    <span className="ml-auto font-tech text-[9px] tracking-wider hidden sm:block">
                      su reproductor no arranca solo
                    </span>
                  </div>
                  <iframe
                    key={current.id}
                    title={`${platformLabel(current.platform)} — ${current.title}`}
                    src={getEmbedUrl(current.platform, current.kind, current.externalId, true) ?? ""}
                    className="flex-1 w-full"
                    style={{ border: 0 }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  />
                </div>
              )}
              {(!started || !current) && (
                <button
                  onClick={() => playable.length > 0 && playAt(0)}
                  disabled={playable.length === 0}
                  className="absolute inset-0 w-full group text-left disabled:cursor-not-allowed"
                >
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 kenburns" />
                  ) : (
                    <div className="absolute inset-0 dial-face opacity-60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                    <span className="flex items-center justify-center w-20 h-20 rounded-full st-bg text-coal border-4 border-coal/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <IconPlay className="w-9 h-9 translate-x-0.5" />
                    </span>
                    <span className="font-display font-bold text-xl md:text-2xl">
                      {playable.length > 0 ? "Sintonizar la estación" : "Esta estación aún no emite"}
                    </span>
                    <span className="font-tech text-[11px] tracking-[0.25em] text-bone-dim uppercase">
                      {playable.length > 0
                        ? `${playable.length} pistas en rotación continua`
                        : "Añade enlaces de YouTube, Spotify, SoundCloud o Deezer"}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* lectura */}
            <div className="flex items-center gap-3 px-4 py-3 bg-coal-2 border-t border-inkline">
              <VuMeter playing={playing} bars={7} className="shrink-0" />
              <div className="min-w-0 flex-1">
                {current ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <PlatformChip platform={current.platform} />
                    <p className="truncate font-display font-semibold text-sm md:text-base">{current.title}</p>
                  </div>
                ) : (
                  <p className="font-tech text-[11px] tracking-widest text-bone-dim uppercase">Sin señal — pulsa sintonizar</p>
                )}
              </div>
              <span className="font-tech text-[11px] text-bone-dim tabular-nums shrink-0">
                {formatDuration(progress.cur)} / {formatDuration(progress.dur)}
              </span>
            </div>

            {/* transporte */}
            <div className="px-4 pb-4 pt-3 bg-coal-2 space-y-3">
              <div className="relative h-2 bg-coal border border-inkline">
                <div className="absolute inset-y-0 left-0 st-bg transition-[width] duration-500" style={{ width: `${pct}%` }} />
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ background: "repeating-linear-gradient(90deg, transparent 0 9%, rgba(0,0,0,.5) 9% calc(9% + 2px))" }}
                />
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <button
                  onClick={() => advance(-1)}
                  disabled={playable.length === 0}
                  className="p-2.5 border border-inkline text-bone hover:st-border hover:st-text transition-colors disabled:opacity-30"
                  aria-label="Anterior"
                >
                  <IconPrev className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={playable.length === 0}
                  className="p-3.5 st-bg text-coal hover:brightness-110 active:translate-y-0.5 transition-all disabled:opacity-30"
                  aria-label={playing ? "Pausar" : "Reproducir"}
                >
                  {playing ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5 translate-x-[1px]" />}
                </button>
                <button
                  onClick={() => advance(1)}
                  disabled={playable.length === 0}
                  className="p-2.5 border border-inkline text-bone hover:st-border hover:st-text transition-colors disabled:opacity-30"
                  aria-label="Siguiente"
                >
                  <IconNext className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShuffle((s) => !s)}
                  className={`p-2.5 border transition-colors ${
                    shuffle ? "st-border st-text st-bg/10" : "border-inkline text-bone-dim hover:text-bone"
                  }`}
                  aria-label="Aleatorio"
                  title="Rotación aleatoria"
                >
                  <IconShuffle className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 ml-auto min-w-[130px] flex-1 max-w-[220px]">
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

                <span className="hidden md:flex items-center gap-1.5 font-tech text-[10px] tracking-widest text-bone-dim uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-onair animate-pulse-dot" />
                  {listeners} oyentes
                </span>
              </div>
              {isIframe && (
                <p className="font-tech text-[10px] tracking-wider text-amber leading-relaxed">
                  ⚠ PISTA {platformLabel(current.platform).toUpperCase()} — el audio no arranca solo: pulsa ▶ dentro del
                  panel de arriba. La barra marca el tiempo en antena, no la reproducción.
                </p>
              )}
              {manualCount > 0 && (
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none group">
                  <span
                    className={`relative w-9 h-5 border transition-colors shrink-0 ${
                      autoOnly ? "st-border st-bg/20" : "border-inkline bg-coal"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${
                        autoOnly ? "left-[18px] st-bg" : "left-0.5 bg-bone-dim"
                      }`}
                    />
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoOnly}
                    onChange={(e) => {
                      setAutoOnly(e.target.checked);
                      setIndex(null);
                      setStarted(false);
                      setPlaying(false);
                      clearIframeTimer();
                    }}
                  />
                  <span className="font-tech text-[10px] tracking-wider text-bone-dim group-hover:text-bone transition-colors">
                    Emisión sin cortes — solo pistas que suenan solas
                    <span className="text-bone-dim/60"> ({manualCount} de {embeddable.length} necesitan play manual)</span>
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* cola */}
          <div className="flex flex-col max-h-[430px] lg:max-h-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-inkline bg-coal-2">
              <h3 className="font-tech text-[11px] tracking-[0.25em] text-bone-dim uppercase">Lista de emisión</h3>
              <span className="font-tech text-[11px] st-text">{shuffle ? "ALEATORIO" : "EN ORDEN"}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {tracks.length === 0 && (
                <p className="px-4 py-8 font-tech text-xs text-bone-dim text-center">
                  Sin pistas. Añade tus enlaces de música desde el panel de control.
                </p>
              )}
              {tracks.map((t) => {
                const playIdx = playable.indexOf(t);
                const active = playIdx !== -1 && playIdx === index;
                if (playIdx === -1) {
                  // Fuera de la rotación actual.
                  // Si la plataforma se puede incrustar (Spotify, SoundCloud,
                  // Deezer) la abrimos DENTRO de la cabina, no en otra pestaña:
                  // salir a Spotify cortaba la escucha.
                  if (isPlayable(t.platform)) {
                    return (
                      <button
                        key={t.id}
                        onClick={() => playEmbeddable(t)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-inkline/60 hover:bg-coal-2 transition-colors group"
                      >
                        <PlatformChip platform={t.platform} />
                        <span className="flex-1 truncate text-sm text-bone/80">{t.title}</span>
                        <span className="font-tech text-[9px] tracking-[0.2em] uppercase shrink-0 text-amber group-hover:brightness-125 transition">
                          ▶ sonar aquí
                        </span>
                      </button>
                    );
                  }
                  // Plataforma sin reproductor incrustable: sí abrimos fuera.
                  return (
                    <a
                      key={t.id}
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-inkline/60 hover:bg-coal-2 transition-colors group"
                    >
                      <PlatformChip platform={t.platform} />
                      <span className="flex-1 truncate text-sm text-bone/80">{t.title}</span>
                      <span className="font-tech text-[9px] tracking-[0.2em] uppercase shrink-0 text-bone-dim group-hover:st-text transition-colors">
                        Escuchar en {platformLabel(t.platform)} ↗
                      </span>
                    </a>
                  );
                }
                return (
                  <button
                    key={t.id}
                    onClick={() => playAt(playIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-inkline/60 transition-colors group ${
                      active ? "bg-coal-3" : "hover:bg-coal-2"
                    }`}
                  >
                    <span className="font-tech text-[10px] text-bone-dim w-6 shrink-0 tabular-nums">
                      {String(playIdx + 1).padStart(2, "0")}
                    </span>
                    <PlatformChip platform={t.platform} />
                    <span className={`flex-1 truncate text-sm ${active ? "font-semibold st-text" : "text-bone"}`}>{t.title}</span>
                    {(t as Track).featured ? <span className="featured-chip shrink-0">Destacada</span> : null}
                    {active && playing ? (
                      <VuMeter playing bars={4} />
                    ) : (
                      <span className="font-tech text-[10px] text-bone-dim tabular-nums">{formatDuration(t.durationSec)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ DOCK FLOTANTE ============ */}
      {started && current && (
        <div
          className="fixed bottom-0 inset-x-0 z-[80] border-t-2 st-border bg-coal/95 backdrop-blur"
          style={{ ["--st" as string]: accent }}
        >
          <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-3">
            <VuMeter playing={playing} bars={5} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-tech text-[9px] tracking-[0.3em] text-bone-dim uppercase">
                {playing ? "Sonando ahora" : "En pausa"}
              </p>
              <p className="truncate font-display font-semibold text-sm leading-tight">{current.title}</p>
            </div>
            <div className="hidden sm:block w-40 h-1.5 bg-coal-3 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 st-bg transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <button onClick={togglePlay} className="p-2 st-bg text-coal hover:brightness-110 transition-all" aria-label={playing ? "Pausar" : "Reproducir"}>
              {playing ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4 translate-x-[1px]" />}
            </button>
            <button
              onClick={() => advance(1)}
              className="p-2 border border-inkline text-bone hover:st-border hover:st-text transition-colors"
              aria-label="Siguiente"
            >
              <IconNext className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
