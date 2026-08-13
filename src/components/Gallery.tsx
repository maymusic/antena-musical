"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconClose, IconArrowRight } from "./icons";
import type { ImageRow } from "@/db/schema";

export default function Gallery({ images, accent }: { images: ImageRow[]; accent: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(0);

  const step = useCallback(
    (dir: 1 | -1) => {
      setOpen((cur) => (cur === null ? cur : (cur + dir + images.length) % images.length));
    },
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - wheelLock.current < 350) return;
    if (Math.abs(e.deltaY) < 12 && Math.abs(e.deltaX) < 12) return;
    wheelLock.current = now;
    step(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // swipe horizontal o vertical: ambos navegan
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (Math.abs(dy) > 60) step(dy < 0 ? 1 : -1);
  };

  if (images.length === 0) return null;
  const current = open !== null ? images[open] : null;

  return (
    <div style={{ ["--st" as string]: accent }}>
      {/*
        Rejilla de fotos a buen tamaño:
        · móvil  → 1 columna a todo el ancho (antes eran 2 diminutas)
        · tablet → 2 columnas
        · escritorio → 3 columnas, con la primera foto destacada al doble
        El pie de foto se ve siempre en táctil (no hay «hover» en el móvil).
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {images.map((img, i) => {
          const featured = i === 0 && images.length > 1;
          return (
            <button
              key={img.id}
              onClick={() => setOpen(i)}
              className={`group relative overflow-hidden border border-inkline bg-coal-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--st)] ${
                featured
                  ? "sm:col-span-2 aspect-[4/3] sm:aspect-[16/9]"
                  : "aspect-[4/3]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || `Foto ${i + 1}`}
                loading={i < 3 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* Pie: siempre legible en móvil, aparece al pasar el ratón en escritorio. */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                <span className="font-tech text-[11px] tracking-wider text-bone line-clamp-2">
                  {img.caption || `CAPTURA ${String(i + 1).padStart(2, "0")}`}
                </span>
              </div>
              <span className="absolute top-2 left-2 font-tech text-[10px] px-1.5 py-0.5 bg-coal/80 text-bone-dim border border-inkline opacity-0 lg:group-hover:opacity-100 transition-opacity">
                VER COMPLETA +
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== VISOR: imagen completa, nunca recortada ===== */}
      {current && open !== null && (
        <div
          className="fixed inset-0 z-[90] bg-coal/97 backdrop-blur-sm flex flex-col"
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* barra superior */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
            <span className="font-tech text-xs text-bone-dim tabular-nums">
              <span className="st-text">{String(open + 1).padStart(2, "0")}</span> / {String(images.length).padStart(2, "0")}
              <span className="hidden sm:inline text-bone-dim/60 ml-3">rueda · flechas · desliza para navegar</span>
            </span>
            <button
              onClick={() => setOpen(null)}
              className="p-2 border border-inkline text-bone hover:bg-[var(--st)] hover:text-coal hover:border-[var(--st)] transition-colors"
              aria-label="Cerrar"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* imagen: object-contain SIEMPRE completa */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16">
            {/* fondo difuminado con la misma foto */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-2xl scale-110"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt={current.caption || "Foto ampliada"}
              className="relative max-h-full max-w-full w-auto h-auto object-contain border border-inkline shadow-2xl select-none"
              draggable={false}
            />

            {/* flechas laterales */}
            <button
              onClick={() => step(-1)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-coal/80 border border-inkline text-bone hover:bg-[var(--st)] hover:text-coal hover:border-[var(--st)] transition-colors"
              aria-label="Anterior"
            >
              <IconArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
            </button>
            <button
              onClick={() => step(1)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-coal/80 border border-inkline text-bone hover:bg-[var(--st)] hover:text-coal hover:border-[var(--st)] transition-colors"
              aria-label="Siguiente"
            >
              <IconArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* pie */}
          <div className="shrink-0 px-4 py-3 flex flex-col items-center gap-2">
            <p className="font-tech text-xs tracking-wider text-bone-dim max-w-lg text-center truncate w-full">
              {current.caption || "SIN TÍTULO"}
            </p>
            <div className="flex items-center gap-1.5 max-w-full overflow-x-auto pb-1">
              {images.map((img, j) => (
                <button
                  key={img.id}
                  onClick={() => setOpen(j)}
                  className={`shrink-0 w-12 h-9 border overflow-hidden transition-all ${
                    j === open ? "border-[var(--st)] opacity-100 scale-105" : "border-inkline opacity-50 hover:opacity-90"
                  }`}
                  aria-label={`Foto ${j + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
