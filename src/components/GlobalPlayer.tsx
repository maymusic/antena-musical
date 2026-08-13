"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDuration } from "@/lib/parse";
import { loadYouTubeApi } from "@/lib/yt";
import { IconNext, IconPause, IconPlay, IconPrev, IconVolume, VuMeter } from "@/components/icons";

export type QueueTrack = {
  id: number;
  title: string;
  externalId: string;
};

type StartOptions = {
  tracks: QueueTrack[];
  artistName: string;
  artistSlug: string;
  accent: string;
  coverUrl?: string;
  startIndex?: number;
};

type Ctx = {
  /** Arranca la emisión persistente: sigue sonando al cambiar de página. */
  start: (options: StartOptions) => void;
  stop: () => void;
  isActive: boolean;
  activeSlug: string | null;
  playing: boolean;
};

const PlayerCtx = createContext<Ctx>({
  start: () => {},
  stop: () => {},
  isActive: false,
  activeSlug: null,
  playing: false,
});

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [meta, setMeta] = useState({ artistName: "", artistSlug: "", accent: "#FF4D00", coverUrl: "" });
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
      if (!track || !playerRef.current?.loadVideoById) return;
      setIndex(i);
      try {
        playerRef.current.loadVideoById(track.externalId);
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

  /* ---- reproductor oculto: vive en el layout, nunca se desmonta al navegar ---- */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
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

  /* ---- progreso ---- */
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      try {
        const cur = playerRef.current?.getCurrentTime?.() ?? 0;
        const dur = playerRef.current?.getDuration?.() ?? 0;
        setProgress({ cur, dur });
      } catch {
        /* noop */
      }
    }, 800);
    return () => clearInterval(id);
  }, [isActive]);

  /* ---- controles del sistema (pantalla bloqueada / auriculares) ---- */
  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: meta.artistName,
        album: "Antena Musical",
        artwork: [
          { src: `${window.location.origin}/api/og/${meta.artistSlug}`, sizes: "1200x630", type: "image/png" },
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
  }, [current, meta.artistName, meta.artistSlug, playing, advance]);

  const start = useCallback(
    ({ tracks, artistName, artistSlug, accent, coverUrl = "", startIndex = 0 }: StartOptions) => {
      if (tracks.length === 0) return;
      setQueue(tracks);
      queueRef.current = tracks;
      setMeta({ artistName, artistSlug, accent, coverUrl });
      setIndex(startIndex);
      indexRef.current = startIndex;
      const track = tracks[startIndex];
      const play = () => {
        try {
          playerRef.current?.loadVideoById?.(track.externalId);
          applyVolume();
          playerRef.current?.playVideo?.();
        } catch {
          /* noop */
        }
      };
      if (playerRef.current?.loadVideoById) play();
      else loadYouTubeApi().then(() => setTimeout(play, 500)).catch(() => {});
      fetch(`/api/tracks/${track.id}/play`, { method: "POST" }).catch(() => {});
    },
    [applyVolume]
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

  const toggle = () => {
    try {
      if (playing) playerRef.current?.pauseVideo?.();
      else playerRef.current?.playVideo?.();
    } catch {
      /* noop */
    }
  };

  const pct = progress.dur > 0 ? Math.min(100, (progress.cur / progress.dur) * 100) : 0;

  return (
    <PlayerCtx.Provider value={{ start, stop, isActive, activeSlug: isActive ? meta.artistSlug : null, playing }}>
      {children}

      {/*
        El iframe vive aquí, en el layout raíz: al cambiar de página React lo conserva,
        por eso la música no se corta. Cuando está minimizado queda fuera de pantalla
        (no con display:none, que detendría el audio en algunos navegadores).
      */}
      <div
        className={
          isActive && expanded
            ? "fixed bottom-[76px] right-4 z-[92] w-[min(340px,90vw)] aspect-video border-2 border-inkline bg-black shadow-2xl"
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
            <VuMeter playing={playing} bars={4} className="shrink-0 hidden xs:flex" />

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

            <button
              onClick={() => advance(-1)}
              className="hidden sm:flex p-2 border border-inkline text-bone-dim hover:st-text hover:st-border transition-colors"
              aria-label="Anterior"
            >
              <IconPrev className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggle}
              disabled={!ready}
              className="p-2.5 st-bg text-coal hover:brightness-110 active:translate-y-0.5 transition-all disabled:opacity-40 shrink-0"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4 translate-x-[1px]" />}
            </button>

            <button
              onClick={() => advance(1)}
              className="p-2 border border-inkline text-bone-dim hover:st-text hover:st-border transition-colors"
              aria-label="Siguiente"
            >
              <IconNext className="w-3.5 h-3.5" />
            </button>

            {/* MUTE */}
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
    </PlayerCtx.Provider>
  );
}

export function useGlobalPlayer() {
  return useContext(PlayerCtx);
}
