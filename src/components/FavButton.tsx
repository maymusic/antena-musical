"use client";

import { useEffect, useState } from "react";

type Fav = { slug: string; name: string; accent: string };
const KEY = "antena:mi-dial";

export function getFavs(): Fav[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Corazón de "añadir a Mi dial" (favoritos guardados en este navegador). */
export default function FavButton({ slug, name, accent }: Fav) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(getFavs().some((f) => f.slug === slug));
  }, [slug]);

  const toggle = () => {
    const favs = getFavs();
    if (on) {
      localStorage.setItem(KEY, JSON.stringify(favs.filter((f) => f.slug !== slug)));
      setOn(false);
    } else {
      localStorage.setItem(KEY, JSON.stringify([...favs, { slug, name, accent }]));
      setOn(true);
    }
  };

  return (
    <button
      onClick={toggle}
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
      {on ? "En mi dial" : "Añadir a mi dial"}
    </button>
  );
}
