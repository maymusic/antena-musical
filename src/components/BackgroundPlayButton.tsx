"use client";

import { useGlobalPlayer, type QueueTrack } from "./GlobalPlayer";

/**
 * Enciende la emisión persistente: sigue sonando mientras el oyente navega
 * por el resto de Antena Musical y en segundo plano en el móvil.
 */
export default function BackgroundPlayButton({
  tracks,
  artistName,
  artistSlug,
  accent,
  className = "",
}: {
  tracks: QueueTrack[];
  artistName: string;
  artistSlug: string;
  accent: string;
  className?: string;
}) {
  const { start, stop, isActive, activeSlug, playing } = useGlobalPlayer();
  const mine = isActive && activeSlug === artistSlug;

  if (tracks.length === 0) return null;

  return (
    <button
      onClick={() => (mine ? stop() : start({ tracks, artistName, artistSlug, accent }))}
      style={{ ["--st" as string]: accent } as React.CSSProperties}
      className={
        className ||
        `inline-flex items-center justify-center gap-2 px-4 py-2.5 border font-tech text-[10px] tracking-[0.2em] uppercase transition-all ${
          mine ? "st-border st-text bg-coal/60" : "border-bone/25 bg-coal/60 text-bone hover:st-border hover:st-text"
        }`
      }
      title={mine ? "Detener la emisión de fondo" : "Sigue sonando mientras navegas"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        {mine ? <><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></> : <path d="M7 4.5v15l13-7.5L7 4.5z" fill="currentColor" stroke="none" />}
      </svg>
      {mine ? (playing ? "Sonando en segundo plano" : "Emisión activa") : "Escuchar en segundo plano"}
    </button>
  );
}
