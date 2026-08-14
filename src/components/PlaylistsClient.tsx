"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { fetchJson } from "@/lib/fetchjson";
import { useGlobalPlayer, type QueueTrack } from "@/components/GlobalPlayer";
import { IconAntenna, IconPlay, IconTrash, PlatformChip } from "@/components/icons";

type Playlist = {
  id: number;
  name: string;
  description: string;
  trackCount: number;
};

type Item = {
  itemId: number;
  trackId: number;
  title: string;
  platform: string;
  externalId: string;
  url: string;
  durationSec: number;
  featured: number;
  artistName: string;
  artistSlug: string;
  accent: string;
};

export default function PlaylistsClient() {
  const { session } = useSession();
  const player = useGlobalPlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [active, setActive] = useState<Playlist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadPlaylists = async () => {
    setLoading(true);
    const res = await fetchJson<{ playlists: Playlist[] }>("/api/playlists", { cache: "no-store" });
    if (res.ok) setPlaylists(res.data?.playlists ?? []);
    else {
      setPlaylists([]);
      setMsg(res.error ?? "");
    }
    setLoading(false);
  };

  const loadDetail = async (p: Playlist) => {
    setActive(p);
    const res = await fetchJson<{ items: Item[] }>(`/api/playlists/${p.id}`, { cache: "no-store" });
    if (res.ok) setItems(res.data?.items ?? []);
    else {
      setItems([]);
      setMsg(res.error ?? "");
    }
  };

  useEffect(() => {
    if (!session.loading && session.logged) loadPlaylists();
    else if (!session.loading) setLoading(false);
  }, [session.loading, session.logged]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetchJson("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return setMsg(res.error ?? "No se pudo crear.");
    setName("");
    await loadPlaylists();
    setMsg("Playlist creada ✔");
  };

  const removeItem = async (item: Item) => {
    if (!active) return;
    const res = await fetchJson(`/api/playlists/${active.id}/tracks?itemId=${item.itemId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setMsg(res.error ?? "No se pudo quitar la canción.");
      return;
    }
    await loadDetail(active);
    await loadPlaylists();
  };

  const youtubeQueue = useMemo<QueueTrack[]>(
    () => items.filter((i) => i.platform === "youtube" && i.externalId).map((i) => ({ id: i.trackId, title: i.title, externalId: i.externalId })),
    [items]
  );

  if (!session.loading && !session.logged) {
    return (
      <div className="neon-panel p-10 text-center hard-shadow" style={{ ["--st" as string]: "#FF4D00" } as React.CSSProperties}>
        <IconAntenna className="w-10 h-10 mx-auto neon-title mb-4" />
        <h2 className="font-display text-2xl font-extrabold mb-2 neon-title">Inicia sesión para crear playlists</h2>
        <p className="text-bone-dim mb-6">Guarda canciones de tus artistas favoritos y escúchalas desde cualquier dispositivo.</p>
        <Link href="/login" className="neon-btn inline-flex px-6 py-3 font-display font-bold hard-shadow">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start" style={{ ["--st" as string]: "#FF4D00" } as React.CSSProperties}>
      <aside className="neon-panel hard-shadow p-5 space-y-5">
        <form onSubmit={create} className="space-y-3">
          <p className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title">Nueva playlist</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-coal border border-inkline px-3 py-2.5 text-bone outline-none focus:border-signal focus:shadow-[0_0_12px_rgba(255,77,0,.25)]"
            placeholder="Ej. Mis favoritas urbanas"
          />
          <button className="neon-btn w-full px-4 py-2.5 font-display font-bold hard-shadow">
            Crear playlist
          </button>
          {msg && <p className="text-xs neon-muted">{msg}</p>}
        </form>

        <div className="space-y-2">
          <p className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title">Tus playlists</p>
          {loading ? <p className="text-sm text-bone-dim">Cargando…</p> : null}
          {playlists.length === 0 && !loading ? <p className="text-sm text-bone-dim">Aún no tienes playlists.</p> : null}
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => loadDetail(p)}
              className={`block w-full text-left px-3 py-3 transition neon-panel ${active?.id === p.id ? "neon-title" : "text-bone hover:brightness-110"}`}
            >
              <span className="block font-display font-bold">{p.name}</span>
              <span className="font-tech text-[9px] tracking-widest uppercase text-bone-dim">{p.trackCount} canciones</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="neon-panel hard-shadow min-h-[420px] overflow-hidden">
        {!active ? (
          <div className="p-10 text-center text-bone-dim">
            Selecciona una playlist o crea una nueva.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-inkline p-5 bg-coal-2">
              <div>
                <p className="font-tech text-[10px] tracking-[0.3em] uppercase neon-title mb-1">Playlist personal</p>
                <h2 className="font-display text-2xl font-extrabold">{active.name}</h2>
              </div>
              <button
                disabled={youtubeQueue.length === 0}
                onClick={() => player.start({ tracks: youtubeQueue, artistName: active.name, artistSlug: "playlists", accent: "#FF4D00" })}
                className="neon-btn inline-flex items-center justify-center gap-2 px-5 py-3 font-display font-bold disabled:opacity-40"
              >
                <IconPlay className="w-4 h-4" /> Escuchar YouTube en segundo plano
              </button>
            </div>
            {items.length === 0 ? (
              <div className="p-10 text-center text-bone-dim">
                Esta playlist está vacía. Entra a un perfil de artista y pulsa “+ playlist” en una canción.
              </div>
            ) : (
              <ul className="divide-y divide-inkline">
                {items.map((item, idx) => (
                  <li key={item.itemId} className="flex items-center gap-3 p-4 hover:bg-coal-2 transition-colors">
                    <span className="font-tech text-[10px] neon-muted w-6">{String(idx + 1).padStart(2, "0")}</span>
                    <PlatformChip platform={item.platform} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-bone">{item.title}</span>
                      <Link href={`/${item.artistSlug}`} className="font-tech text-[9px] uppercase tracking-widest text-bone-dim hover:neon-title">
                        {item.artistName}
                      </Link>
                    </span>
                    {item.featured ? <span className="featured-chip">Destacada</span> : null}
                    {item.platform !== "youtube" ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="font-tech text-[9px] uppercase tracking-widest neon-muted hover:neon-title">
                        Abrir ↗
                      </a>
                    ) : null}
                    <button onClick={() => removeItem(item)} className="p-2 neon-muted hover:neon-title" aria-label="Quitar canción">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
