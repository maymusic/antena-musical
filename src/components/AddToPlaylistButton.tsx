"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { fetchJson } from "@/lib/fetchjson";

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
    fetchJson<{ playlists: Playlist[] }>("/api/playlists", { cache: "no-store" }).then((res) => {
      if (res.ok) setPlaylists(res.data?.playlists ?? []);
      else {
        setPlaylists([]);
        setMsg(res.error ?? "");
      }
    });
  }, [open, session.logged]);

  const createAndAdd = async () => {
    setBusy(true);
    setMsg("");

    const created = await fetchJson<{ playlist: Playlist }>("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Mi playlist" }),
    });

    if (!created.ok || !created.data?.playlist?.id) {
      setMsg(created.error ?? "No se pudo crear la playlist.");
      setBusy(false);
      return;
    }

    const nueva = created.data.playlist;
    setPlaylists((cur) => [...cur, nueva]);
    setBusy(false);
    await addTo(nueva.id);
  };

  const addTo = async (playlistId: number) => {
    setBusy(true);
    setMsg("");

    const res = await fetchJson<{ already?: boolean }>(`/api/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    });

    setBusy(false);

    if (!res.ok) {
      setMsg(res.error ?? "No se pudo añadir.");
      return;
    }

    setMsg(res.data?.already ? "Ya estaba en esa playlist" : "Añadida a tu playlist ✔");
    setTimeout(() => setOpen(false), 900);
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
