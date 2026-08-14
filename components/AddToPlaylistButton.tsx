"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";

type Playlist = { id: number; name: string; trackCount?: number };

export default function AddToPlaylistButton({
  trackId,
  trackTitle,
  accent = "#FF4D00",
}: {
  trackId: number;
  trackTitle: string;
  accent?: string;
}) {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open || !session.logged) return;
    fetch("/api/playlists", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPlaylists(d.playlists ?? []))
      .catch(() => setPlaylists([]));
  }, [open, session.logged]);

  const createAndAdd = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mi playlist" }),
      }).catch(() => null);
      const created = res ? await res.json().catch(() => ({})) : {};
      if (!created.playlist?.id) throw new Error(created.error ?? "No se pudo crear la playlist.");
      await addTo(created.playlist.id);
      setPlaylists((cur) => [...cur, created.playlist]);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addTo = async (playlistId: number) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (!res || !res.ok) throw new Error(data.error ?? "No se pudo añadir.");
      setMsg(data.already ? "Ya estaba en esa playlist" : "Añadida a tu playlist ✔");
      setTimeout(() => setOpen(false), 900);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!session.logged) {
    return (
      <a
        href="/login"
        className="font-tech text-[9px] tracking-[0.24em] uppercase neon-muted hover:neon-title"
        title="Inicia sesión para crear playlists"
      >
        + playlist
      </a>
    );
  }

  return (
    <span className="relative inline-flex" style={{ ["--st" as string]: accent } as React.CSSProperties}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="featured-chip hover:brightness-110"
        title={`Añadir «${trackTitle}» a una playlist`}
      >
        + playlist
      </button>
      {open && (
        <span className="neon-panel absolute right-0 top-full z-[90] mt-2 w-72 p-3.5 shadow-2xl">
          <span className="block font-tech text-[9px] tracking-[0.28em] uppercase neon-title mb-2">
            Añadir a playlist
          </span>
          <span className="mb-3 block text-xs text-bone-dim leading-relaxed">
            Guarda <strong className="text-bone">{trackTitle}</strong> en una de tus listas personales.
          </span>
          {playlists.length === 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={createAndAdd}
              className="neon-btn w-full px-3 py-2.5 font-display font-bold text-sm disabled:opacity-50"
            >
              Crear “Mi playlist” y añadir
            </button>
          ) : (
            <span className="block space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() => addTo(p.id)}
                  className="neon-panel block w-full text-left px-3 py-2.5 text-sm text-bone hover:brightness-110 disabled:opacity-50"
                >
                  <span className="block font-display font-bold">{p.name}</span>
                  <span className="font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                    {p.trackCount ?? 0} canciones
                  </span>
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={createAndAdd}
                className="block w-full text-left px-3 py-2 text-xs font-tech uppercase tracking-[0.24em] neon-muted hover:neon-title disabled:opacity-50"
              >
                + Crear otra playlist rápida
              </button>
            </span>
          )}
          {msg && <span className="mt-3 block text-xs neon-muted">{msg}</span>}
        </span>
      )}
    </span>
  );
}
