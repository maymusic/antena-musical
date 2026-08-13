"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Track } from "@/db/schema";
import { formatDuration, isPlayable } from "@/lib/parse";
import { getEmbedUrl } from "@/lib/embed";
import { loadYouTubeApi } from "@/lib/yt";
import { IconPause, IconPlay, IconNext, IconVolume, PlatformChip, VuMeter } from "@/components/icons";

type GlobalPlayerCtx = {
  playTrack: (track: Track, artistName: string, artistSlug: string, accent: string) => void;
  current: Track | null;
  playing: boolean;
  toggle: () => void;
  stop: () => void;
};

const Ctx = createContext<GlobalPlayerCtx>({
  playTrack: () => {},
  current: null,
  playing: false,
  toggle: () => {},
  stop: () => {},
});

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [artistName, setArtistName] = useState("");
  const [artistSlug, setArtistSlug] = useState("");
  const [accent, setAccent] = useState("#FF4D00");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);

  const playerRef = useRef<any>(null);

  useEffect(() => {
    loadYouTubeApi()
      .then((YT) => {
        if (playerRef.current) return;
        playerRef.current = new YT.Player("global-yt-target", {
          width: "1",
          height: "1",
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => {
              playerRef.current?.setVolume?.(volume);
            },
            onStateChange: (e: any) => {
              if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
              if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            },
          },
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      playerRef.current?.setVolume?.(muted ? 0 : volume);
    } catch {
      /* noop */
    }
  }, [volume, muted]);

  const playTrack = (track: Track, name: string, slug: string, col: string) => {
    setCurrent(track);
    setArtistName(name);
    setArtistSlug(slug);
    setAccent(col);
    setPlaying(true);

    if (track.platform === "youtube") {
      try {
        playerRef.current?.loadVideoById?.(track.externalId);
        playerRef.current?.setVolume?.(muted ? 0 : volume);
        playerRef.current?.playVideo?.();
      } catch {
        /* noop */
      }
    }
  };

  const toggle = () => {
    if (!current) return;
    if (current.platform === "youtube" && playerRef.current) {
      if (playing) {
        playerRef.current.pauseVideo();
        setPlaying(false);
      } else {
        playerRef.current.playVideo();
        setPlaying(true);
      }
    } else {
      setPlaying((p) => !p);
    }
  };

  const stop = () => {
    try {
      playerRef.current?.stopVideo?.();
    } catch {
      /* noop */
    }
    setCurrent(null);
    setPlaying(false);
  };

  return (
    <Ctx.Provider value={{ playTrack, current, playing, toggle, stop }}>
      {children}
      {/* contenedor oculto de YouTube para segundo plano */}
      <div className="fixed -top-20 -left-20 w-1 h-1 overflow-hidden opacity-0 pointer-events-none" aria-hidden>
        <div id="global-yt-target" />
      </div>

      {/* barra flotante persistente global */}
      {current && (
        <aside
          aria-label="Reproductor persistente"
          className="fixed bottom-0 inset-x-0 z-[90] border-t-2 bg-coal/98 backdrop-blur shadow-2xl"
          style={{ ["--st" as string]: accent } as React.CSSProperties}
        >
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <VuMeter playing={playing} bars={5} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <PlatformChip platform={current.platform} />
                <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim truncate">
                  {artistName}
                </p>
              </div>
              <p className="truncate font-display font-semibold text-sm leading-tight">{current.title}</p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setMuted((m) => !m)}
                className={`p-2 border transition-colors ${
                  muted ? "border-signal text-signal bg-signal/10" : "border-inkline text-bone-dim hover:text-bone"
                }`}
                title={muted ? "Activar sonido" : "Silenciar"}
                aria-label={muted ? "Activar sonido" : "Silenciar"}
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
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
                className="fader w-24"
                style={{ ["--fill" as string]: `${muted ? 0 : volume}%` } as React.CSSProperties}
                aria-label="Volumen global"
              />
            </div>

            <button
              onClick={toggle}
              className="p-2.5 st-bg text-coal hover:brightness-110 active:translate-y-0.5 transition-all"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? <IconPause className="w-4 h-4" /> : <IconPlay className="w-4 h-4 translate-x-[1px]" />}
            </button>
            <button
              onClick={stop}
              className="p-2 border border-inkline text-bone-dim hover:text-bone hover:border-bone/40 transition-colors"
              title="Cerrar reproductor"
              aria-label="Cerrar reproductor"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
    </Ctx.Provider>
  );
}

export function useGlobalPlayer() {
  return useContext(Ctx);
}
