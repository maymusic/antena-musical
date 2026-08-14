"use client";

import { useEffect, useState } from "react";

/**
 * Avisos de nuevas canciones:
 * - El fan pulsa la campana y damos permiso de Notification.
 * - Guardamos la última pista vista por estación en localStorage.
 * - Al volver a la web (cualquier página con la campana), si hay pistas nuevas → notificación.
 */
export default function NotifyBell({
  artistId,
  artistName,
  artistSlug,
  latestTrackId,
  accent,
}: {
  artistId: number;
  artistName: string;
  artistSlug: string;
  latestTrackId: number;
  accent: string;
}) {
  const [status, setStatus] = useState<"off" | "on" | "unsupported">("off");
  const storageKey = `antena:notify:${artistSlug}`;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    const stored = localStorage.getItem(storageKey);
    if (stored && Notification.permission === "granted") {
      setStatus("on");
      const lastSeen = parseInt(stored, 10) || 0;
      if (latestTrackId > lastSeen) {
        try {
          new Notification(`📻 ${artistName} subió música nueva`, {
            body: "Entra a su estación de ANTENA MUSICAL para escucharla en la rotación.",
            tag: `antena-${artistSlug}`,
          });
        } catch {
          /* algunos navegadores exigen service worker */
        }
        localStorage.setItem(storageKey, String(latestTrackId));
      }
    }
  }, [storageKey, latestTrackId, artistName, artistSlug]);

  const toggle = async () => {
    if (status === "unsupported") return;
    if (status === "on") {
      localStorage.removeItem(storageKey);
      setStatus("off");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem(storageKey, String(latestTrackId));
      setStatus("on");
      try {
        new Notification(`🔔 Avisos activados para ${artistName}`, {
          body: "Te avisaremos aquí cuando suba canciones nuevas.",
          tag: `antena-${artistSlug}-hello`,
        });
      } catch {
        /* noop */
      }
    }
  };

  if (status === "unsupported") return null;

  return (
    <button
      onClick={toggle}
      style={{ ["--st" as string]: accent }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 border font-tech text-[10px] tracking-[0.2em] uppercase transition-all ${
        status === "on"
          ? "st-border st-text bg-coal/60"
          : "border-bone/25 text-bone hover:st-border hover:st-text bg-coal/60"
      }`}
      title={status === "on" ? "Desactivar avisos de nuevas canciones" : "Avisarme cuando suba canciones nuevas"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        {status === "on" && <circle cx="18.5" cy="5.5" r="3" fill="currentColor" stroke="none" />}
      </svg>
      {status === "on" ? "Avisos activados" : "Avisarme de nuevas canciones"}
    </button>
  );
}
