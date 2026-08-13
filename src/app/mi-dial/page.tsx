"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { useSession } from "@/components/SessionProvider";
import { getLocalFavs } from "@/components/FavButton";
import { IconArrowRight, IconAntenna, IconVerified } from "@/components/icons";

type Fav = {
  id?: number;
  slug: string;
  name: string;
  accent?: string;
  verificationStatus?: string;
};

export default function MiDialPage() {
  const { session } = useSession();
  const [favs, setFavs] = useState<Fav[] | null>(null);

  useEffect(() => {
    if (session.logged) {
      fetch("/api/favorites", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          setFavs(data.favorites ?? []);
        })
        .catch(() => setFavs(getLocalFavs()));
    } else {
      setFavs(getLocalFavs());
    }
  }, [session.logged]);

  const remove = async (slug: string, id?: number) => {
    if (session.logged && id) {
      // si está logueado, hacemos POST al API para des-favoritear
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: id }),
      }).catch(() => {});
    }
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
          {session.logged
            ? "Tus estaciones favoritas sincronizadas con tu cuenta en la nube. ¡Disponibles desde cualquier dispositivo!"
            : "Las estaciones que guardas con el corazón. Inicia sesión para sincronizarlas automáticamente en la nube."}
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
                style={{ ["--st" as string]: f.accent ?? "#FF4D00" }}
              >
                <Link href={`/${f.slug}`} className="flex items-center gap-4 p-5">
                  <span className="flex items-center justify-center w-12 h-12 rounded-full st-bg text-coal font-display font-extrabold text-xl shrink-0">
                    {f.name[0]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 font-display font-extrabold text-lg group-hover:st-text transition-colors">
                      <span className="truncate">{f.name}</span>
                      {f.verificationStatus === "approved" && (
                        <IconVerified className="w-4 h-4 shrink-0" />
                      )}
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
                    onClick={() => remove(f.slug, f.id)}
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
