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
      const created = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mi playlist" }),
      }).then((r) => r.json());
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
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo añadir.");
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
        className="font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim hover:text-signal"
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
        className="font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim hover:st-text"
        title={`Añadir «${trackTitle}» a una playlist`}
      >
        + playlist
      </button>
      {open && (
        <span className="absolute right-0 top-full z-[90] mt-2 w-64 border border-inkline bg-coal p-3 shadow-2xl">
          <span className="block font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim mb-2">
            Añadir a playlist
          </span>
          {playlists.length === 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={createAndAdd}
              className="w-full px-3 py-2 st-bg text-coal font-display font-bold text-sm"
            >
              Crear “Mi playlist” y añadir
            </button>
          ) : (
            <span className="block space-y-1 max-h-52 overflow-y-auto">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() => addTo(p.id)}
                  className="block w-full text-left px-3 py-2 border border-inkline text-sm text-bone hover:st-border hover:st-text"
                >
                  {p.name} <span className="text-bone-dim">({p.trackCount ?? 0})</span>
                </button>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={createAndAdd}
                className="block w-full text-left px-3 py-2 text-xs font-tech uppercase tracking-wider text-bone-dim hover:st-text"
              >
                + Crear otra playlist rápida
              </button>
            </span>
          )}
          {msg && <span className="mt-2 block text-xs text-bone-dim">{msg}</span>}
        </span>
      )}
    </span>
  );
}
