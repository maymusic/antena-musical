"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { useGlobalPlayer, type QueueTrack } from "@/components/GlobalPlayer";
import WinampPlayer, { type WinampTrack } from "@/components/WinampPlayer";
import ShareButtons from "@/components/ShareButtons";
import { IconAntenna, IconPlay, IconTrash, PlatformChip } from "@/components/icons";

type Playlist = {
  id: number;
  name: string;
  description: string;
  isPublic: number;
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
    try {
      const res = await fetch("/api/playlists", { cache: "no-store" });
      const data = res.ok ? await res.json() : { playlists: [] };
      setPlaylists(data.playlists ?? []);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (p: Playlist) => {
    setActive(p);
    setItems([]);
    try {
      const res = await fetch(`/api/playlists/${p.id}`, { cache: "no-store" });
      const data = res.ok ? await res.json() : { items: [] };
      setItems(data.items ?? []);
      if (data.playlist) {
        const refreshed = { ...p, ...data.playlist, trackCount: data.items?.length ?? p.trackCount } as Playlist;
        setActive(refreshed);
        setPlaylists((current) => current.map((x) => (x.id === p.id ? refreshed : x)));
      }
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    if (!session.loading && session.logged) loadPlaylists();
    else if (!session.loading) setLoading(false);
  }, [session.loading, session.logged]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error ?? "No se pudo crear.");
    setName("");
    await loadPlaylists();
    setMsg("Playlist creada ✔");
  };

  const removeItem = async (item: Item) => {
    if (!active) return;
    await fetch(`/api/playlists/${active.id}/tracks?itemId=${item.itemId}`, { method: "DELETE" });
    await loadDetail(active);
    await loadPlaylists();
  };

  const removePlaylist = async (p: Playlist) => {
    if (!confirm(`¿Borrar la playlist «${p.name}»? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`/api/playlists/${p.id}`, { method: "DELETE" });
    } catch {
      /* seguimos: refrescamos igual */
    }
    if (active?.id === p.id) {
      setActive(null);
      setItems([]);
    }
    await loadPlaylists();
    setMsg("Playlist borrada");
  };

  const togglePublic = async () => {
    if (!active) return;
    const next = active.isPublic ? 0 : 1;
    setMsg("");
    try {
      const res = await fetch(`/api/playlists/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.playlist) {
        setMsg(data.error ?? "No se pudo actualizar la visibilidad.");
        return;
      }
      const updated = { ...active, ...data.playlist } as Playlist;
      setActive(updated);
      setPlaylists((current) => current.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setMsg(next ? "Playlist publicada: ya puedes compartirla ✔" : "Playlist puesta en privado");
    } catch {
      setMsg("No se pudo actualizar la visibilidad.");
    }
  };

  const publicUrl = (id: number) =>
    typeof window !== "undefined" ? `${window.location.origin}/playlists/${id}` : `/playlists/${id}`;

  const youtubeQueue = useMemo<QueueTrack[]>(
    () => items.filter((i) => i.platform === "youtube" && i.externalId).map((i) => ({ id: i.trackId, title: i.title, externalId: i.externalId })),
    [items]
  );

  /** Pistas para el mezclador retro (solo YouTube: son las que suenan solas). */
  const winampTracks = useMemo<WinampTrack[]>(
    () =>
      items
        .filter((i) => i.platform === "youtube" && i.externalId)
        .map((i) => ({
          trackId: i.trackId,
          title: i.title,
          artistName: i.artistName,
          externalId: i.externalId,
          durationSec: i.durationSec,
          accent: i.accent || "#43e56c",
        })),
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
            <div
              key={p.id}
              className={`neon-panel flex items-center gap-2 px-3 py-3 transition ${active?.id === p.id ? "neon-title" : "text-bone hover:brightness-110"}`}
            >
              <button onClick={() => loadDetail(p)} className="flex-1 min-w-0 text-left">
                <span className="block font-display font-bold truncate">{p.name}</span>
                <span className="font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                  {p.trackCount} canciones · {p.isPublic ? "● pública" : "○ privada"}
                </span>
              </button>
              <button
                onClick={() => removePlaylist(p)}
                className="shrink-0 p-2 text-bone-dim hover:text-signal transition-colors"
                title={`Borrar «${p.name}»`}
                aria-label={`Borrar playlist ${p.name}`}
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
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
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-extrabold">{active.name}</h2>
                  <span className="featured-chip">{active.isPublic ? "● Pública" : "○ Privada"}</span>
                </div>
                {active.isPublic && (
                  <a
                    href={publicUrl(active.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block max-w-md truncate font-tech text-[9px] tracking-widest neon-muted hover:neon-title"
                  >
                    {publicUrl(active.id)} ↗
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={youtubeQueue.length === 0}
                  onClick={() => player.start({ tracks: youtubeQueue, artistName: active.name, artistSlug: "playlists", accent: "#FF4D00" })}
                  className="neon-btn inline-flex items-center justify-center gap-2 px-5 py-3 font-display font-bold disabled:opacity-40"
                >
                  <IconPlay className="w-4 h-4" /> Segundo plano
                </button>
                <button
                  onClick={togglePublic}
                  className={`inline-flex items-center gap-2 px-4 py-3 border font-tech text-[10px] tracking-[0.16em] uppercase transition-colors ${
                    active.isPublic
                      ? "border-onair text-onair bg-onair/10"
                      : "border-inkline text-bone-dim hover:text-onair hover:border-onair"
                  }`}
                  title={active.isPublic ? "Ocultar esta playlist al público" : "Publicar y obtener enlace para compartir"}
                >
                  {active.isPublic ? "● Pública" : "Publicar"}
                </button>
                <button
                  onClick={() => removePlaylist(active)}
                  className="inline-flex items-center gap-2 px-4 py-3 border border-inkline font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:text-signal hover:border-signal transition-colors"
                  title="Borrar esta playlist"
                >
                  <IconTrash className="w-4 h-4" /> Borrar
                </button>
              </div>
            </div>

            {active.isPublic && (
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-inkline bg-onair/5">
                <span className="font-tech text-[9px] tracking-[0.24em] uppercase text-onair">Compartir playlist pública</span>
                <ShareButtons title={`${active.name} — Playlist pública en ANTENA MUSICAL`} accent="#43e56c" shareUrl={publicUrl(active.id)} />
              </div>
            )}

            {/* Mezclador retro: automezcla + modo TV a pantalla completa */}
            {winampTracks.length > 0 && (
              <div className="p-5 border-b border-inkline">
                <WinampPlayer tracks={winampTracks} playlistName={active.name} />
              </div>
            )}

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
                      <Link
                        href={`/${item.artistSlug}/cancion/${item.trackId}`}
                        className="block truncate font-semibold text-bone hover:neon-title transition-colors"
                        title="Abrir la página de la canción (para compartirla)"
                      >
                        {item.title}
                      </Link>
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
