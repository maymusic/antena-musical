"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { formatDuration } from "@/lib/parse";
import { loadYouTubeApi } from "@/lib/yt";
import { IconNext, IconPause, IconPlay, IconPrev, IconVolume, VuMeter } from "./icons";

/** Pista mínima que necesita el reproductor persistente. */
export type QueueTrack = {
  id: number;
  title: string;
  externalId: string;
  platform?: string;
};

export type StartOptions = {
  tracks: QueueTrack[];
  artistName: string;
  artistSlug: string;
  accent: string;
  coverUrl?: string;
  startIndex?: number;
};

type Ctx = {
  /** Forma recomendada: arranca una cola completa. */
  start: (options: StartOptions) => void;
  /** Forma simple (compatible): arranca una sola pista. */
  playTrack: (track: QueueTrack, artistName: string, artistSlug: string, accent: string) => void;
  stop: () => void;
  toggle: () => void;
  current: QueueTrack | null;
  isActive: boolean;
  activeSlug: string | null;
  playing: boolean;
};

const GlobalPlayerCtx = createContext<Ctx>({
  start: () => {},
  playTrack: () => {},
  stop: () => {},
  toggle: () => {},
  current: null,
  isActive: false,
  activeSlug: null,
  playing: false,
});

export function GlobalPlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [meta, setMeta] = useState({ artistName: "", artistSlug: "", accent: "#FF4D00" });
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState({ cur: 0, dur: 0 });
  const [expanded, setExpanded] = useState(false);

  const playerRef = useRef<any>(null);
  const queueRef = useRef<QueueTrack[]>([]);
  const indexRef = useRef(0);
  const mutedRef = useRef(false);
  const volumeRef = useRef(80);
  queueRef.current = queue;
  indexRef.current = index;
  mutedRef.current = muted;
  volumeRef.current = volume;

  const current = queue[index] ?? null;
  const isActive = queue.length > 0;

  const applyVolume = useCallback(() => {
    try {
      if (mutedRef.current) playerRef.current?.mute?.();
      else {
        playerRef.current?.unMute?.();
        playerRef.current?.setVolume?.(volumeRef.current);
      }
    } catch {
      /* noop */
    }
  }, []);

  const loadAt = useCallback(
    (i: number) => {
      const track = queueRef.current[i];
      if (!track) return;
      setIndex(i);
      try {
        playerRef.current?.loadVideoById?.(track.externalId);
        applyVolume();
      } catch {
        /* noop */
      }
      fetch(`/api/tracks/${track.id}/play`, { method: "POST" }).catch(() => {});
    },
    [applyVolume]
  );

  const advance = useCallback(
    (dir: 1 | -1) => {
      const total = queueRef.current.length;
      if (total === 0) return;
      loadAt((indexRef.current + dir + total) % total);
    },
    [loadAt]
  );

  /* El iframe vive en el layout raíz: al navegar no se desmonta y la música sigue. */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT: any) => {
        if (cancelled || playerRef.current) return;
        playerRef.current = new YT.Player("antena-global-player", {
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0 },
          events: {
            onReady: () => {
              setReady(true);
              applyVolume();
            },
            onStateChange: (e: any) => {
              if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
              else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
              else if (e.data === YT.PlayerState.ENDED) advance(1);
            },
            onError: () => advance(1),
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [applyVolume, advance]);

  useEffect(() => {
    applyVolume();
  }, [muted, volume, applyVolume]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      try {
        setProgress({
          cur: playerRef.current?.getCurrentTime?.() ?? 0,
          dur: playerRef.current?.getDuration?.() ?? 0,
        });
      } catch {
        /* noop */
      }
    }, 800);
    return () => clearInterval(id);
  }, [isActive]);

  /* Controles del sistema: pantalla bloqueada y auriculares. */
  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: meta.artistName,
        album: "Antena Musical",
        artwork: [
          { src: `https://i.ytimg.com/vi/${current.externalId}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" },
        ],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => playerRef.current?.playVideo?.());
      navigator.mediaSession.setActionHandler("pause", () => playerRef.current?.pauseVideo?.());
      navigator.mediaSession.setActionHandler("nexttrack", () => advance(1));
      navigator.mediaSession.setActionHandler("previoustrack", () => advance(-1));
    } catch {
      /* noop */
    }
  }, [current, meta.artistName, playing, advance]);

  const start = useCallback(
    ({ tracks, artistName, artistSlug, accent, startIndex = 0 }: StartOptions) => {
      const list = tracks.filter((t) => t.externalId);
      if (list.length === 0) return;
      setQueue(list);
      queueRef.current = list;
      setMeta({ artistName, artistSlug, accent });
      setIndex(startIndex);
      indexRef.current = startIndex;

      const track = list[startIndex] ?? list[0];
      const go = () => {
        try {
          playerRef.current?.loadVideoById?.(track.externalId);
          applyVolume();
          playerRef.current?.playVideo?.();
        } catch {
          /* noop */
        }
      };
      if (playerRef.current?.loadVideoById) go();
      else loadYouTubeApi().then(() => setTimeout(go, 600)).catch(() => {});
      fetch(`/api/tracks/${track.id}/play`, { method: "POST" }).catch(() => {});
    },
    [applyVolume]
  );

  /** Compatibilidad: reproducir una sola pista. */
  const playTrack = useCallback(
    (track: QueueTrack, artistName: string, artistSlug: string, accent: string) => {
      start({ tracks: [track], artistName, artistSlug, accent });
    },
    [start]
  );

  const stop = useCallback(() => {
    try {
      playerRef.current?.stopVideo?.();
    } catch {
      /* noop */
    }
    setQueue([]);
    setPlaying(false);
    setExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    try {
      if (playing) playerRef.current?.pauseVideo?.();
      else playerRef.current?.playVideo?.();
    } catch {
      /* noop */
    }
  }, [playing]);

  const pct = progress.dur > 0 ? Math.min(100, (progress.cur / progress.dur) * 100) : 0;

  return (
    <GlobalPlayerCtx.Provider
      value={{ start, playTrack, stop, toggle, current, isActive, activeSlug: isActive ? meta.artistSlug : null, playing }}
    >
      {children}

      {/*
        Cuando está minimizado se mueve fuera de pantalla en vez de ocultarse con
        display:none, porque eso detendría el audio en algunos navegadores.
      */}
      <div
        className={
          isActive && expanded
            ? "fixed bottom-[80px] right-4 z-[92] w-[min(340px,90vw)] aspect-video border-2 border-inkline bg-black shadow-2xl"
            : "fixed w-[320px] aspect-video opacity-0 pointer-events-none -z-10"
        }
        style={isActive && expanded ? undefined : { left: "-9999px", top: "-9999px" }}
        aria-hidden={!expanded}
      >
        <div id="antena-global-player" className="w-full h-full" />
      </div>

      {isActive && current && (
        <aside
          aria-label="Reproductor de Antena Musical"
          className="fixed bottom-0 inset-x-0 z-[93] border-t-2 bg-coal/97 backdrop-blur"
          style={{ ["--st" as string]: meta.accent, borderTopColor: meta.accent } as React.CSSProperties}
        >
          <div className="h-1 w-full bg-coal-3">
            <div className="h-full st-bg transition-[width] duration-700 ease-linear" style={{ width: `${pct}%` }} />
          </div>

          <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2.5 flex items-center gap-2.5 sm:gap-3">
            <VuMeter playing={playing} bars={4} className="shrink-0 hidden sm:flex" />

            <div className="min-w-0 flex-1">
              <p className="font-tech text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-bone-dim truncate">
                {playing ? "Sonando" : "En pausa"} ·{" "}
                <Link href={`/${meta.artistSlug}`} className="st-text hover:underline">
                  {meta.artistName}
                </Link>
              </p>
              <p className="truncate font-display font-semibold text-xs sm:text-sm leading-tight">{current.title}</p>
            </div>

            <span className="hidden md:block font-tech text-[10px] text-bone-dim tabular-nums shrink-0">
              {formatDuration(progress.cur)} / {formatDuration(progress.dur)}
            </span>

            {queue.length > 1 && (
              <button
                onClick={() => advance(-1)}
                className="hidden sm:flex p-2 border border-inkline text-bone-dim hover:st-text hover:st-border transition-colors"
                aria-label="Anterior"
              >
                <IconPrev className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={toggle}
              disabled={!ready}
              className="p-2.5 st-bg text-coal hover:brightness-110 active:translate-y-0.5 transition-all disabled:opacity-40 shrink-0"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4 translate-x-[1px]" />}
            </button>

            {queue.length > 1 && (
              <button
                onClick={() => advance(1)}
                className="p-2 border border-inkline text-bone-dim hover:st-text hover:st-border transition-colors"
                aria-label="Siguiente"
              >
                <IconNext className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setMuted((m) => !m)}
              className={`p-2 border transition-colors shrink-0 ${
                muted ? "border-signal text-signal bg-signal/10" : "border-inkline text-bone-dim hover:text-bone"
              }`}
              aria-label={muted ? "Quitar silencio" : "Silenciar"}
              title={muted ? "Quitar silencio" : "Silenciar"}
            >
              {muted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
                  <path d="M22 9l-6 6M16 9l6 6" />
                </svg>
              ) : (
                <IconVolume className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (muted) setMuted(false);
              }}
              className="fader hidden lg:block w-24 shrink-0"
              style={{ ["--fill" as string]: `${muted ? 0 : volume}%` } as React.CSSProperties}
              aria-label="Volumen"
            />

            <button
              onClick={() => setExpanded((v) => !v)}
              className="hidden sm:flex p-2 border border-inkline text-bone-dim hover:text-bone transition-colors shrink-0"
              aria-label={expanded ? "Ocultar video" : "Mostrar video"}
              title={expanded ? "Ocultar video" : "Mostrar video"}
            >
              {expanded ? "▾" : "▴"}
            </button>

            <button
              onClick={stop}
              className="p-2 border border-inkline text-bone-dim hover:bg-signal hover:text-coal hover:border-signal transition-colors shrink-0"
              aria-label="Cerrar reproductor"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
    </GlobalPlayerCtx.Provider>
  );
}

export function useGlobalPlayer() {
  return useContext(GlobalPlayerCtx);
}
