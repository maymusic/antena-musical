"use client";

import type { Track } from "@/db/schema";
import { useGlobalPlayer } from "@/components/GlobalPlayer";
import { IconPlay } from "@/components/icons";

/**
 * Enciende el reproductor persistente global con la primera pista de YouTube.
 * Sigue sonando aunque el usuario navegue a otras páginas.
 */
export default function BackgroundListen({
  tracks,
  artistName,
  artistSlug,
  accent,
}: {
  tracks: Track[];
  artistName: string;
  artistSlug: string;
  accent: string;
}) {
  const { playTrack, current, playing } = useGlobalPlayer();
  const ytTracks = tracks.filter((t) => t.platform === "youtube");
  if (ytTracks.length === 0) return null;

  const isThis = current && ytTracks.some((t) => t.id === current.id);

  const start = () => {
    playTrack(ytTracks[0], artistName, artistSlug, accent);
  };

  return (
    <button
      onClick={start}
      style={{ ["--st" as string]: accent } as React.CSSProperties}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-bone/25 bg-coal/60 text-bone font-tech text-[10px] tracking-[0.2em] uppercase hover:st-border hover:st-text transition-colors"
      title="Suena mientras navegas por el sitio"
    >
      <IconPlay className="w-3.5 h-3.5" />
      {isThis && playing ? "Sonando en segundo plano" : "Escuchar en segundo plano"}
    </button>
  );
}
