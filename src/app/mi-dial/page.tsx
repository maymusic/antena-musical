"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { IconArrowRight, IconAntenna } from "@/components/icons";

type Fav = { slug: string; name: string; accent: string };

export default function MiDialPage() {
  const [favs, setFavs] = useState<Fav[] | null>(null);

  useEffect(() => {
    try {
      setFavs(JSON.parse(localStorage.getItem("antena:mi-dial") ?? "[]"));
    } catch {
      setFavs([]);
    }
  }, []);

  const remove = (slug: string) => {
    const next = (favs ?? []).filter((f) => f.slug !== slug);
    localStorage.setItem("antena:mi-dial", JSON.stringify(next));
    setFavs(next);
  };

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-4xl px-4 pt-12 pb-8">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Tu sintonía personal</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.98]">
          Mi dial<span className="text-signal">.</span>
        </h1>
        <p className="mt-4 text-bone-dim max-w-xl">
          Las estaciones que guardas con el corazón. Se guardan en este navegador — como las presintonías de un radio.
        </p>

        {favs === null ? (
          <p className="mt-10 font-tech text-xs text-bone-dim animate-blink">SINTONIZANDO PRESINTONÍAS…</p>
        ) : favs.length === 0 ? (
          <div className="mt-10 border border-dashed border-inkline p-12 text-center">
            <IconAntenna className="w-10 h-10 text-bone-dim mx-auto mb-4" />
            <p className="font-display font-bold text-xl mb-2">Tu dial está vacío</p>
            <p className="text-bone-dim text-sm mb-6">
              Entra a cualquier estación y pulsa «Añadir a mi dial» para guardarla aquí.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-signal text-coal font-display font-bold hover:brightness-110 transition-all hard-shadow"
            >
              Explorar el dial <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {favs.map((f) => (
              <div
                key={f.slug}
                className="group border border-inkline bg-panel hard-shadow overflow-hidden"
                style={{ ["--st" as string]: f.accent }}
              >
                <Link href={`/${f.slug}`} className="flex items-center gap-4 p-5">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full st-bg text-coal font-display font-extrabold text-xl shrink-0">
                    {f.name[0]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display font-extrabold text-lg truncate group-hover:st-text transition-colors">
                      {f.name}
                    </span>
                    <span className="block font-tech text-[10px] tracking-widest uppercase text-bone-dim">
                      /{f.slug}
                    </span>
                  </span>
                  <IconArrowRight className="w-4 h-4 text-bone-dim group-hover:st-text group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
                <div className="px-5 pb-4 flex items-center justify-between">
                  <Link href={`/${f.slug}/radio`} className="font-tech text-[9px] tracking-[0.25em] uppercase st-text hover:underline">
                    Escuchar su radio
                  </Link>
                  <button
                    onClick={() => remove(f.slug)}
                    className="font-tech text-[9px] tracking-widest uppercase text-bone-dim hover:text-signal transition-colors"
                  >
                    Quitar ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
