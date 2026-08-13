"use client";

import BackgroundPlayButton from "./BackgroundPlayButton";

type AnyTrack = {
  id: number;
  title: string;
  externalId: string;
  platform: string;
};

/**
 * Alias de compatibilidad: acepta las pistas completas del artista, filtra las
 * que pueden sonar en segundo plano (YouTube) y delega en BackgroundPlayButton.
 */
export default function BackgroundListen({
  tracks,
  artistName,
  artistSlug,
  accent,
  className = "",
}: {
  tracks: AnyTrack[];
  artistName: string;
  artistSlug: string;
  accent: string;
  className?: string;
}) {
  const queue = (tracks ?? [])
    .filter((t) => t.platform === "youtube" && t.externalId)
    .map((t) => ({ id: t.id, title: t.title, externalId: t.externalId }));

  return (
    <BackgroundPlayButton
      tracks={queue}
      artistName={artistName}
      artistSlug={artistSlug}
      accent={accent}
      className={className}
    />
  );
}
