"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/yt";
import { formatDuration } from "@/lib/parse";
import { IconNext, IconPause, IconPlay, IconPrev, IconShuffle, IconClose } from "@/components/icons";

export type WinampTrack = {
  trackId: number;
  title: string;
  artistName: string;
  externalId: string;
  durationSec: number;
  accent: string;
};

/**
 * Reproductor retro tipo Winamp para las playlists.
 *
 * - Marquesina con el título, ecualizador y osciloscopio animados.
 * - Automezcla: encadena las canciones solas, con orden aleatorio opcional.
 * - Modo TV: pantalla completa con visualizador grande para dejarlo puesto.
 */
export default function WinampPlayer({
  tracks,
  playlistName,
}: {
  tracks: WinampTrack[];
  playlistName: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [automix, setAutomix] = useState(true);
  const [volume, setVolume] = useState(85);
  const [progress, setProgress] = useState({ cur: 0, dur: 0 });
  const [tv, setTv] = useState(false);
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 20 }, () => 0.2));

  const playerRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const shuffleRef = useRef(false);
  const automixRef = useRef(true);
  const tracksRef = useRef<WinampTrack[]>(tracks);
  indexRef.current = index;
  shuffleRef.current = shuffle;
  automixRef.current = automix;
  tracksRef.current = tracks;

  const current = tracks[index] ?? null;
  const accent = current?.accent ?? "#43e56c";

  const pickNext = useCallback((from: number, dir: 1 | -1) => {
    const total = tracksRef.current.length;
    if (total <= 1) return from;
    if (shuffleRef.current) {
      let n = from;
      while (n === from) n = Math.floor(Math.random() * total);
      return n;
    }
    return (from + dir + total) % total;
  }, []);

  const loadAt = useCallback((i: number, autoplay = true) => {
    const t = tracksRef.current[i];
    if (!t) return;
    setIndex(i);
    indexRef.current = i;
    try {
      playerRef.current?.loadVideoById?.(t.externalId);
      if (!autoplay) playerRef.current?.pauseVideo?.();
    } catch {
      /* noop */
    }
    fetch(`/api/tracks/${t.trackId}/play`, { method: "POST" }).catch(() => {});
  }, []);

  const advance = useCallback(
    (dir: 1 | -1) => loadAt(pickNext(indexRef.current, dir)),
    [loadAt, pickNext]
  );

  /* ---- reproductor de YouTube (oculto: aquí manda la carátula retro) ---- */
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || playerRef.current) return;
        playerRef.current = new YT.Player("winamp-yt", {
          width: "100%",
          height: "100%",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0 },
          events: {
            onReady: () => {
              setReady(true);
              playerRef.current?.setVolume?.(volume);
            },
            onStateChange: (e: any) => {
              if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
              else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
              else if (e.data === YT.PlayerState.ENDED) {
                if (automixRef.current) advance(1);
                else setPlaying(false);
              }
            },
            onError: () => advance(1),
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
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

  /* ---- progreso + animación del visualizador ---- */
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const cur = playerRef.current?.getCurrentTime?.() ?? 0;
        const dur = playerRef.current?.getDuration?.() ?? 0;
        setProgress({ cur, dur });
      } catch {
        /* noop */
      }
      setBars((prev) =>
        prev.map((v) => {
          if (!playing) return Math.max(0.06, v * 0.82);
          const target = Math.random();
          return v + (target - v) * 0.55;
        })
      );
    }, 120);
    return () => clearInterval(id);
  }, [playing]);

  /* ---- pantalla completa real (modo TV) ---- */
  const toggleTv = async () => {
    try {
      if (!document.fullscreenElement) {
        await shellRef.current?.requestFullscreen?.();
        setTv(true);
      } else {
        await document.exitFullscreen?.();
        setTv(false);
      }
    } catch {
      setTv((v) => !v);
    }
  };

  useEffect(() => {
    const onFs = () => setTv(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggle = () => {
    if (!current) return;
    try {
      if (playing) playerRef.current?.pauseVideo?.();
      else {
        if (!playerRef.current?.getVideoData?.()?.video_id) loadAt(index);
        else playerRef.current?.playVideo?.();
      }
    } catch {
      /* noop */
    }
  };

  if (tracks.length === 0) return null;

  const pct = progress.dur > 0 ? Math.min(100, (progress.cur / progress.dur) * 100) : 0;

  return (
    <div
      ref={shellRef}
      className={`winamp ${tv ? "winamp-tv" : ""}`}
      style={{ ["--st" as string]: accent } as React.CSSProperties}
    >
      {/* el video vive oculto: mostramos la estética retro */}
      <div className="absolute -left-[9999px] -top-[9999px] w-[320px] aspect-video" aria-hidden>
        <div id="winamp-yt" />
      </div>

      {/* ---- barra de título ---- */}
      <div className="winamp-title">
        <span className="font-tech text-[9px] tracking-[0.3em] uppercase">
          ANTENA MUSICAL · {tv ? "MODO TV" : "MEZCLADOR"}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <button onClick={toggleTv} className="winamp-tbtn" title={tv ? "Salir de pantalla completa" : "Modo TV a pantalla completa"}>
            {tv ? "▭" : "⛶"}
          </button>
          {tv && (
            <button onClick={toggleTv} className="winamp-tbtn" title="Cerrar">
              <IconClose className="w-3 h-3" />
            </button>
          )}
        </span>
      </div>

      <div className={tv ? "flex-1 flex flex-col justify-center p-6 sm:p-12" : "p-3.5"}>
        {/* ---- pantalla LCD ---- */}
        <div className="winamp-lcd">
          <div className="flex items-center gap-3">
            <span className="winamp-num tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className={`whitespace-nowrap ${playing ? "winamp-marquee" : ""}`}>
                <span className={`winamp-track ${tv ? "text-3xl sm:text-5xl" : "text-sm sm:text-base"}`}>
                  {current?.title} — {current?.artistName}
                </span>
              </div>
              <p className={`font-tech text-bone-dim/70 tracking-[0.25em] uppercase ${tv ? "text-sm mt-2" : "text-[8px] mt-0.5"}`}>
                {playing ? "▶ reproduciendo" : "❚❚ en pausa"} · {formatDuration(progress.cur)} / {formatDuration(progress.dur || current?.durationSec || 0)}
                {automix && " · automezcla"}
                {shuffle && " · aleatorio"}
              </p>
            </div>
            <span className={`winamp-kbps font-tech tabular-nums ${tv ? "text-base" : "text-[9px]"}`}>
              {playing ? "128" : "---"} kbps · stereo
            </span>
          </div>

          {/* ---- visualizador ---- */}
          <div className={`winamp-viz ${tv ? "h-40 sm:h-64 mt-6" : "h-12 mt-3"}`}>
            {bars.map((v, i) => (
              <span key={i} className="winamp-bar" style={{ height: `${Math.max(4, v * 100)}%` }} />
            ))}
          </div>
        </div>

        {/* ---- barra de progreso ---- */}
        <div
          className="winamp-seek"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            try {
              playerRef.current?.seekTo?.(ratio * (progress.dur || 0), true);
            } catch {
              /* noop */
            }
          }}
        >
          <div className="winamp-seek-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* ---- transporte ---- */}
        <div className={`flex flex-wrap items-center gap-2 ${tv ? "mt-6 justify-center" : "mt-3"}`}>
          <button onClick={() => advance(-1)} className="winamp-btn" aria-label="Anterior">
            <IconPrev className={tv ? "w-6 h-6" : "w-4 h-4"} />
          </button>
          <button
            onClick={toggle}
            disabled={!ready}
            className={`winamp-btn winamp-btn-main ${tv ? "px-8 py-4" : ""}`}
            aria-label={playing ? "Pausar" : "Reproducir"}
          >
            {playing ? <IconPause className={tv ? "w-7 h-7" : "w-4 h-4"} /> : <IconPlay className={tv ? "w-7 h-7" : "w-4 h-4"} />}
          </button>
          <button onClick={() => advance(1)} className="winamp-btn" aria-label="Siguiente">
            <IconNext className={tv ? "w-6 h-6" : "w-4 h-4"} />
          </button>

          <button
            onClick={() => setShuffle((v) => !v)}
            className={`winamp-btn ${shuffle ? "winamp-on" : ""}`}
            title="Orden aleatorio"
          >
            <IconShuffle className={tv ? "w-6 h-6" : "w-4 h-4"} />
          </button>

          <button
            onClick={() => setAutomix((v) => !v)}
            className={`winamp-btn font-tech text-[9px] tracking-[0.2em] uppercase px-3 ${automix ? "winamp-on" : ""}`}
            title="Automezcla: encadena las canciones sin parar"
          >
            Automix
          </button>

          <div className={`flex items-center gap-2 ${tv ? "w-64" : "ml-auto w-28"}`}>
            <span className="font-tech text-[8px] text-bone-dim">VOL</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="fader w-full"
              style={{ ["--fill" as string]: `${volume}%` } as React.CSSProperties}
              aria-label="Volumen"
            />
          </div>
        </div>

        {/* ---- lista (solo en modo TV se ve grande) ---- */}
        {tv && (
          <div className="mt-8 max-h-52 overflow-y-auto neon-panel p-3">
            {tracks.map((t, i) => (
              <button
                key={t.trackId}
                onClick={() => loadAt(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                  i === index ? "winamp-on" : "text-bone-dim hover:text-bone"
                }`}
              >
                <span className="font-tech text-xs tabular-nums w-7">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 truncate">{t.title}</span>
                <span className="font-tech text-xs text-bone-dim">{t.artistName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!tv && (
        <p className="px-3.5 pb-3 font-tech text-[8px] tracking-[0.2em] uppercase text-bone-dim">
          {playlistName} · {tracks.length} pistas · pulsa ⛶ para verlo en la tele
        </p>
      )}
    </div>
  );
}
