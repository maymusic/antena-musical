"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageRow } from "@/db/schema";
import { IconClose } from "./icons";

export default function PhotoReel({
  images,
  accent,
}: {
  images: ImageRow[];
  accent: string;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [transition, setTransition] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; ts: number } | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") go(1);
      if (e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => Math.max(0, Math.min(images.length - 1, i + dir)));
    },
    [images.length]
  );

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 20) return;
    go(e.deltaY > 0 ? 1 : -1);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    dragStart.current = { y, ts: Date.now() };
    setDragY(0);
    setTransition(false);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const y = e.touches[0].clientY;
    setDragY(y - dragStart.current.y);
  };
  const onTouchEnd = () => {
    if (!dragStart.current) return;
    const dy = dragY;
    const elapsed = Date.now() - dragStart.current.ts;
    const velocity = Math.abs(dy) / Math.max(1, elapsed);
    const threshold = 80;
    const flick = velocity > 0.5;
    dragStart.current = null;
    setTransition(true);
    if (dy > threshold || (dy > 40 && flick)) go(-1);
    else if (dy < -threshold || (dy < -40 && flick)) go(1);
    setDragY(0);
  };

  if (images.length === 0) return null;

  return (
    <>
      {/* trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 px-5 py-3 border border-inkline bg-panel text-bone hover:st-border hover:st-text transition-colors font-display font-bold text-sm hard-shadow"
        style={{ ["--st" as string]: accent } as React.CSSProperties}
      >
        <span className="font-tech text-[9px] tracking-[0.25em] uppercase st-text">REEL ▸</span>
        Ver galería a pantalla completa
      </button>

      {/* reel */}
      {open && (
        <div
          ref={containerRef}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="fixed inset-0 z-[100] bg-coal overflow-hidden select-none"
          style={{ ["--st" as string]: accent } as React.CSSProperties}
        >
          {/* top bar */}
          <div className="absolute top-0 inset-x-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-coal/80 via-coal/40 to-transparent">
            <div className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone/80">
              <span className="st-text">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-bone/50"> / {String(images.length).padStart(2, "0")}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2.5 bg-coal/70 border border-inkline text-bone hover:st-border hover:st-text transition-colors"
              aria-label="Cerrar reel"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* slides */}
          <div
            className="h-full w-full transition-transform ease-out"
            style={{
              transform: `translateY(${-index * 100 + (dragY / (typeof window !== "undefined" ? window.innerHeight : 900)) * 100}%)`,
              transitionDuration: transition ? "500ms" : "0ms",
            }}
          >
            {images.map((img, i) => (
              <div key={img.id} className="h-screen w-full relative flex items-center justify-center">
                {/* fondo difuminado */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover opacity-25 blur-2xl scale-110"
                  draggable={false}
                />
                {/* foto completa, sin recortes */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* llena la pantalla manteniendo proporción, también si la foto es pequeña */}
                <img
                  src={img.url}
                  alt={img.caption || `Foto ${i + 1}`}
                  className="relative h-[86vh] w-[94vw] object-contain drop-shadow-2xl"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                {/* caption */}
                <div className="absolute inset-x-0 bottom-20 p-6 md:p-10 max-w-2xl">
                  <p className="font-tech text-[10px] tracking-[0.3em] uppercase st-text mb-2">
                    captura {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="font-display font-extrabold text-2xl md:text-4xl leading-tight text-bone drop-shadow-lg">
                    {img.caption || "—"}
                  </p>
                </div>

                {/* progress dots */}
                {i === index && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                    {images.map((_, j) => (
                      <button
                        key={j}
                        onClick={() => {
                          setTransition(true);
                          setIndex(j);
                        }}
                        className={`w-1.5 transition-all ${
                          j === i ? "h-7 st-bg" : "h-1.5 bg-bone/40 hover:bg-bone/70"
                        }`}
                        aria-label={`Ir a foto ${j + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* nav arrows (solo en desktop) */}
          <div className="hidden md:flex absolute inset-y-0 inset-x-0 pointer-events-none items-center justify-between p-6 z-10">
            <button
              onClick={() => {
                setTransition(true);
                go(-1);
              }}
              disabled={index === 0}
              className="pointer-events-auto p-3 bg-coal/60 border border-inkline text-bone hover:st-border hover:st-text transition-colors disabled:opacity-30"
              aria-label="Anterior"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => {
                setTransition(true);
                go(1);
              }}
              disabled={index === images.length - 1}
              className="pointer-events-auto p-3 bg-coal/60 border border-inkline text-bone hover:st-border hover:st-text transition-colors disabled:opacity-30"
              aria-label="Siguiente"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* hint */}
          {index === 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-bone/60 animate-bounce z-10 pointer-events-none">
              <span className="font-tech text-[9px] tracking-[0.3em] uppercase">Desliza</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      )}
    </>
  );
}
