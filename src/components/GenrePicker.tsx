"use client";

import { useMemo, useState } from "react";
import { GENRE_GROUPS, MAX_GENRES } from "@/lib/parse";
import { IconClose } from "./icons";

export default function GenrePicker({
  selected,
  onToggle,
  max = MAX_GENRES,
}: {
  selected: string[];
  onToggle: (genre: string) => void;
  max?: number;
}) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GENRE_GROUPS.map((g) => ({
      group: g.group,
      genres: needle ? g.genres.filter((x) => x.toLowerCase().includes(needle)) : g.genres,
    })).filter((g) => g.genres.length > 0);
  }, [q]);

  const toggle = (g: string) => {
    if (selected.includes(g)) {
      onToggle(g);
      return;
    }
    if (selected.length >= max) return;
    onToggle(g);
  };

  return (
    <div className="space-y-3">
      {/* seleccionados */}
      <div className="flex flex-wrap items-center gap-2 min-h-10">
        {selected.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => toggle(g)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-signal border border-signal text-coal text-xs font-bold transition-all hard-shadow translate-y-[-1px]"
            title="Quitar"
          >
            {g}
            <IconClose className="w-3 h-3" />
          </button>
        ))}
        {selected.length === 0 && (
          <span className="font-tech text-[10px] tracking-wider text-bone-dim">
            Elige hasta {max} géneros para que tu gente te encuentre
          </span>
        )}
        <span className="ml-auto font-tech text-[10px] tracking-widest text-bone-dim tabular-nums">
          {selected.length}/{max}
        </span>
      </div>

      {/* buscador */}
      <div className="relative">
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-dim"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          className="w-full bg-coal border border-inkline pl-9 pr-3 py-2.5 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar entre +100 géneros (ej. cumbia, metal, jazz…)"
        />
      </div>

      {/* catálogo */}
      <div className="border border-inkline bg-coal-2 p-4 max-h-64 overflow-y-auto space-y-4">
        {groups.length === 0 && (
          <p className="font-tech text-xs text-bone-dim text-center py-4">
            Nada para «{q}». Si no existe, tú lo inventas: elige «Experimental».
          </p>
        )}
        {groups.map((g) => (
          <div key={g.group}>
            <p className="font-tech text-[9px] tracking-[0.3em] uppercase text-bone-dim mb-2">{g.group}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.genres.map((genre) => {
                const on = selected.includes(genre);
                const full = !on && selected.length >= max;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggle(genre)}
                    disabled={full}
                    className={`px-2.5 py-1 text-xs font-semibold border transition-all disabled:opacity-30 ${
                      on
                        ? "st-bg st-border text-coal"
                        : "border-inkline text-bone-dim hover:text-bone hover:border-bone/40"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
