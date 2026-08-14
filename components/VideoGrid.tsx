"use client";

import { useState } from "react";
import type { Track } from "@/db/schema";
import { IconPlay, IconYoutube } from "./icons";

/** Videoteca: miniaturas de YouTube que se convierten en reproductor al hacer clic. */
export default function VideoGrid({ videos, accent }: { videos: Track[]; accent: string }) {
  const [active, setActive] = useState<number | null>(null);

  if (videos.length === 0) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-4" style={{ ["--st" as string]: accent }}>
      {videos.map((v) => (
        <div key={v.id} className="border border-inkline bg-panel overflow-hidden group">
          <div className="relative aspect-video bg-black">
            {active === v.id ? (
              <iframe
                title={v.title}
                src={`https://www.youtube.com/embed/${v.externalId}?autoplay=1&rel=0`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => {
                  setActive(v.id);
                  fetch(`/api/tracks/${v.id}/play`, { method: "POST" }).catch(() => {});
                }}
                className="absolute inset-0 w-full text-left"
                aria-label={`Reproducir ${v.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${v.externalId}/hqdefault.jpg`}
                  alt={v.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex items-center justify-center w-14 h-14 rounded-full st-bg text-coal border-4 border-coal/40 transition-transform duration-300 group-hover:scale-110">
                    <IconPlay className="w-6 h-6 translate-x-0.5" />
                  </span>
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <IconYoutube className="w-4 h-4 text-signal shrink-0" />
            <p className="flex-1 truncate font-display font-bold text-sm">{v.title}</p>
            <span className="font-tech text-[9px] tracking-widest text-bone-dim uppercase shrink-0">
              {v.plays.toLocaleString("es")} rep.
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
