"use client";

import { useEffect, useState } from "react";
import { useSession } from "./SessionProvider";

type Fav = { slug: string; name: string; accent: string };
const KEY = "antena:mi-dial";

export function getLocalFavs(): Fav[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function FavButton({
  artistId,
  slug,
  name,
  accent,
}: {
  artistId: number;
  slug: string;
  name: string;
  accent: string;
}) {
  const { session } = useSession();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session.logged) {
      fetch("/api/favorites", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          const list = data.favorites ?? [];
          setOn(list.some((f: any) => f.slug === slug));
        })
        .catch(() => {});
    } else {
      setOn(getLocalFavs().some((f) => f.slug === slug));
    }
  }, [session.logged, slug]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    if (session.logged) {
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistId }),
        });
        const data = await res.json();
        if (res.ok) setOn(data.favorited);
      } finally {
        setBusy(false);
      }
    } else {
      const favs = getLocalFavs();
      if (on) {
        localStorage.setItem(KEY, JSON.stringify(favs.filter((f) => f.slug !== slug)));
        setOn(false);
      } else {
        localStorage.setItem(KEY, JSON.stringify([...favs, { slug, name, accent }]));
        setOn(true);
      }
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      style={{ ["--st" as string]: accent }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 border font-tech text-[10px] tracking-[0.2em] uppercase transition-all ${
        on ? "st-border st-text bg-coal/60" : "border-bone/25 text-bone hover:st-border hover:st-text bg-coal/60"
      }`}
      title={on ? "Quitar de Mi dial" : "Añadir a Mi dial"}
    >
      <svg
        viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.6 5 5 0 1 1 7.5 6.6z" />
      </svg>
      {on ? "En mi dial (sincronizado)" : "Añadir a mi dial"}
    </button>
  );
}
