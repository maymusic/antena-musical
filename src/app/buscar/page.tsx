"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { IconArrowRight, IconMapPin, IconVerified, PlatformChip, VuMeter } from "@/components/icons";

type FoundArtist = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  genres: string[];
  accent: string;
  coverUrl: string;
  avatarUrl: string;
  verificationStatus: string;
};

type FoundTrack = {
  id: number;
  title: string;
  platform: string;
  url: string;
  plays: number;
  artistName: string;
  artistSlug: string;
  accent: string;
};

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const [artists, setArtists] = useState<FoundArtist[]>([]);
  const [tracks, setTracks] = useState<FoundTrack[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setArtists([]);
      setTracks([]);
      setSearched(false);
      return;
    }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setArtists(data.artists ?? []);
        setTracks(data.tracks ?? []);
        setSearched(true);
      } catch {
        /* noop */
      } finally {
        setBusy(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-4xl px-4 pt-12 pb-8">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Rastreador de frecuencias</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.98]">
          Buscar en el dial<span className="text-signal">.</span>
        </h1>
        <p className="mt-4 text-bone-dim">Encuentra artistas por nombre, género o ciudad — y canciones por título.</p>

        <div className="relative mt-8">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bone-dim"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            autoFocus
            className="w-full bg-panel border border-inkline pl-12 pr-24 py-4 text-lg text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors hard-shadow"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. Neblina, punk, Veracruz, marea…"
          />
          {busy && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-tech text-[10px] tracking-[0.25em] text-signal animate-blink">
              BUSCANDO
            </span>
          )}
        </div>

        {searched && artists.length === 0 && tracks.length === 0 && !busy && (
          <div className="mt-12 border border-dashed border-inkline p-10 text-center">
            <p className="font-display font-bold text-xl mb-1">Solo estática en esa frecuencia</p>
            <p className="text-bone-dim text-sm">
              Nada para «{q.trim()}». Prueba con otro nombre, género o ciudad.
            </p>
          </div>
        )}

        {artists.length > 0 && (
          <section className="mt-10">
            <h2 className="font-tech text-[11px] tracking-[0.3em] uppercase text-bone-dim mb-4">
              Estaciones · {artists.length}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {artists.map((a) => (
                <Link
                  key={a.id}
                  href={`/${a.slug}`}
                  className="group flex items-center gap-4 border border-inkline bg-panel p-4 hover:-translate-y-0.5 transition-all hard-shadow"
                  style={{ ["--st" as string]: a.accent }}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border st-border bg-coal-2 shrink-0">
                    {a.avatarUrl || a.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatarUrl || a.coverUrl} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center font-display font-extrabold text-xl st-text">
                        {a.name[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-extrabold truncate group-hover:st-text transition-colors flex items-center gap-1.5">
                      {a.name}
                      {a.verificationStatus === "approved" && <IconVerified className="w-4 h-4 shrink-0" />}
                    </p>
                    <p className="text-xs text-bone-dim truncate">{a.tagline || a.genres.join(" · ")}</p>
                    {a.city && (
                      <p className="flex items-center gap-1 font-tech text-[9px] tracking-widest uppercase text-bone-dim mt-0.5">
                        <IconMapPin className="w-3 h-3" /> {a.city}
                      </p>
                    )}
                  </div>
                  <IconArrowRight className="w-4 h-4 text-bone-dim group-hover:st-text group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {tracks.length > 0 && (
          <section className="mt-10">
            <h2 className="font-tech text-[11px] tracking-[0.3em] uppercase text-bone-dim mb-4">
              Canciones · {tracks.length}
            </h2>
            <ul className="border border-inkline divide-y divide-inkline">
              {tracks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.artistSlug}`}
                    className="flex items-center gap-3 px-4 py-3 bg-panel hover:bg-coal-2 transition-colors group"
                    style={{ ["--st" as string]: t.accent }}
                  >
                    <PlatformChip platform={t.platform} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate group-hover:st-text transition-colors">
                        {t.title}
                      </span>
                      <span className="block font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                        {t.artistName}
                      </span>
                    </span>
                    <span className="hidden sm:flex items-center gap-2 shrink-0">
                      <VuMeter playing bars={3} />
                      <span className="font-tech text-[9px] text-bone-dim">{t.plays.toLocaleString("es")} rep.</span>
                    </span>
                    <IconArrowRight className="w-4 h-4 text-bone-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
