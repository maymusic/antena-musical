"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconPlay, IconSpotify, IconYoutube, VuMeter } from "./icons";

export type DialStation = {
  id: number;
  slug: string;
  name: string;
  freq: string;
  genres: string[];
  firstTrack: string | null;
  firstPlatform: "youtube" | "spotify" | null;
};

export default function DialPanel({ stations }: { stations: DialStation[] }) {
  const [sel, setSel] = useState(0);
  const station = stations[sel];
  const freqNum = station ? parseFloat(station.freq) : 97.5;
  const pct = Math.min(100, Math.max(0, ((freqNum - 88) / 20) * 100));

  return (
    <div className="border border-inkline bg-panel hard-shadow noise relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-inkline bg-coal-2">
        <span className="font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim">Sintonizador · FM</span>
        <span className="flex items-center gap-1.5 font-tech text-[10px] tracking-widest text-signal">
          <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> TX
        </span>
      </div>

      {/* dial face */}
      <div className="relative px-4 pt-6 pb-4">
        <div className="dial-face relative h-24 border border-inkline overflow-hidden">
          <div className="absolute inset-x-3 top-2 flex justify-between font-tech text-[9px] text-bone-dim/80 tabular-nums">
            {[88, 92, 96, 100, 104, 108].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          {/* station marks */}
          {stations.map((s, i) => {
            const p = ((parseFloat(s.freq) - 88) / 20) * 100;
            return (
              <button
                key={s.id}
                onClick={() => setSel(i)}
                aria-label={`Sintonizar ${s.name}`}
                className="absolute bottom-0 h-10 w-4 -translate-x-1/2 group"
                style={{ left: `${p}%` }}
              >
                <span
                  className={`block mx-auto w-0.5 h-full transition-colors ${
                    i === sel ? "bg-signal" : "bg-bone/30 group-hover:bg-bone/70"
                  }`}
                />
              </button>
            );
          })}
          {/* needle */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-signal shadow-[0_0_10px_rgba(255,77,0,0.9)] transition-[left] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ left: `${pct}%` }}
          >
            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-signal" />
          </div>
          <div className="absolute bottom-1.5 left-3 font-tech text-[10px] tracking-widest text-amber tabular-nums">
            {station ? `${station.freq} MHz` : "---.- MHz"}
          </div>
        </div>

        {/* readout */}
        <div className="mt-4 border border-inkline bg-coal px-4 py-3.5 min-h-[92px] flex flex-col justify-center">
          {station ? (
            <>
              <p className="font-tech text-[9px] tracking-[0.3em] uppercase text-bone-dim mb-1 flex items-center gap-2">
                En el dial <VuMeter playing bars={4} />
              </p>
              <p className="font-display font-extrabold text-xl leading-tight truncate">{station.name}</p>
              <p className="text-sm text-bone-dim truncate flex items-center gap-1.5 mt-0.5">
                {station.firstPlatform === "spotify" ? (
                  <IconSpotify className="w-3.5 h-3.5 text-onair shrink-0" />
                ) : (
                  <IconYoutube className="w-3.5 h-3.5 text-signal shrink-0" />
                )}
                {station.firstTrack ?? "Estación recién inaugurada"}
              </p>
            </>
          ) : (
            <p className="font-tech text-xs text-bone-dim">Ruido blanco… aún no hay estaciones en el dial.</p>
          )}
        </div>

        {/* presets */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stations.slice(0, 6).map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSel(i)}
              className={`px-2 py-2 border font-tech text-[10px] tracking-wider truncate transition-all ${
                i === sel
                  ? "border-signal text-signal bg-signal/10 translate-y-[-1px]"
                  : "border-inkline text-bone-dim hover:text-bone hover:border-bone/40"
              }`}
            >
              <span className="block text-[8px] text-bone-dim/70">P{i + 1} · {s.freq}</span>
              {s.name}
            </button>
          ))}
        </div>

        {station && (
          <Link
            href={`/${station.slug}`}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-signal text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all"
          >
            <IconPlay className="w-4 h-4" /> Escuchar {station.name} <IconArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
