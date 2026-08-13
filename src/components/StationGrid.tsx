"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fakeFrequency } from "@/lib/parse";
import { IconMapPin, IconVerified, VuMeter } from "./icons";

export type GridStation = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  genres: string[];
  city: string;
  coverUrl: string;
  accent: string;
  trackCount: number;
  plays: number;
  verified: boolean;
};

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "nuevas", label: "Nuevas en el dial" },
  { id: "populares", label: "Más escuchadas" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

export default function StationGrid({ stations }: { stations: GridStation[] }) {
  const [filter, setFilter] = useState<FilterId>("todas");

  const sorted = useMemo(() => {
    if (filter === "nuevas") return [...stations].sort((a, b) => b.id - a.id);
    if (filter === "populares") return [...stations].sort((a, b) => b.plays - a.plays);
    return stations;
  }, [stations, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 font-tech text-[10px] tracking-[0.2em] uppercase border transition-all ${
              filter === f.id
                ? "border-signal text-signal bg-signal/10"
                : "border-inkline text-bone-dim hover:text-bone hover:border-bone/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((s) => (
          <Link
            key={s.id}
            href={`/${s.slug}`}
            className="group block border border-inkline bg-panel hard-shadow hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
            style={{ ["--st" as string]: s.accent }}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-coal-2">
              {s.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.coverUrl}
                  alt={s.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full dial-face flex items-center justify-center">
                  <span className="font-display font-extrabold text-6xl st-text">{s.name[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-coal via-transparent to-transparent" />
              <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-coal/85 border border-inkline font-tech text-[9px] tracking-[0.25em] text-onair">
                <span className="w-1.5 h-1.5 rounded-full bg-onair animate-pulse-dot" /> ON AIR
              </span>
              <span className="absolute top-3 right-3 px-2 py-1 bg-coal/85 border border-inkline font-tech text-[10px] tracking-widest text-amber tabular-nums">
                {fakeFrequency(s.id)} MHz
              </span>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <VuMeter playing bars={5} />
                <span className="font-tech text-[10px] tracking-widest uppercase text-bone/90">
                  {s.trackCount} pistas · {s.plays.toLocaleString("es")} rep.
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-display font-extrabold text-xl group-hover:st-text transition-colors flex items-center gap-1.5">
                {s.name}
                {s.verified && (
                  <IconVerified className="w-4 h-4 shrink-0" />
                )}
              </h3>
              {s.tagline && <p className="text-sm text-bone-dim truncate mt-0.5">{s.tagline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {s.genres.slice(0, 3).map((g) => (
                  <span key={g} className="px-2 py-0.5 border border-inkline font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                    {g}
                  </span>
                ))}
                {s.city && (
                  <span className="ml-auto flex items-center gap-1 font-tech text-[10px] text-bone-dim">
                    <IconMapPin className="w-3 h-3" /> {s.city}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
