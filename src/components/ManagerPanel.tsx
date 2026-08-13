"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Artist, ImageRow, Show, Track } from "@/db/schema";
import { ACCENTS, MAX_GENRES, SOCIAL_FIELDS, formatDate, isPlayable, parseDurationInput, parseMusicUrl } from "@/lib/parse";
import GenrePicker from "./GenrePicker";
import ChangePassword from "./ChangePassword";
import {
  IconCalendar,
  IconCheck,
  IconClose,
  IconEdit,
  IconEye,
  IconImage,
  IconMusic,
  IconRadio,
  IconTrash,
  IconVerified,
  PlatformChip,
  platformLabel,
  socialIcon,
} from "./icons";

type Full = {
  artist: Artist;
  tracks: Track[];
  images: ImageRow[];
  shows: Show[];
};

const TABS = [
  { id: "perfil", label: "Perfil", icon: IconEdit },
  { id: "galeria", label: "Galería", icon: IconImage },
  { id: "canciones", label: "Canciones", icon: IconMusic },
  { id: "letras", label: "Letras", icon: IconMusic },
  { id: "creditos", label: "Créditos", icon: IconEdit },
  { id: "fechas", label: "Fechas", icon: IconCalendar },
  { id: "stats", label: "Stats", icon: IconRadio },
  { id: "verificar", label: "Verificar", icon: IconVerified },
] as const;
type TabId = (typeof TABS)[number]["id"];

const jsonHeaders = { "Content-Type": "application/json" };
const j = (data: unknown) => JSON.stringify(data);

async function apiCall(url: string, opts: RequestInit) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error en la operación");
  return data;
}

const inputCls =
  "w-full bg-coal border border-inkline px-3.5 py-2.5 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors";
const labelCls = "block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2";

/* ================= PERFIL ================= */
function ProfileTab({
  artist,
  onSaved,
  notify,
}: {
  artist: Artist;
  onSaved: (a: Artist) => void;
  notify: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    name: artist.name,
    tagline: artist.tagline,
    city: artist.city,
    bio: artist.bio,
    accent: artist.accent,
    genres: artist.genres,
    socials: artist.socials,
    phone: artist.phone,
    booking: artist.booking,
    presskitUrl: artist.presskitUrl,
    presskitLabel: artist.presskitLabel,
  });
  const [busy, setBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverLink, setCoverLink] = useState("");
  const [avatarLink, setAvatarLink] = useState("");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await apiCall(`/api/artists/${artist.id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: j({ patch: form }),
      });
      onSaved(data.artist);
      notify("Perfil actualizado ✔");
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveDriveImage = async (url: string, target: "cover" | "avatar") => {
    if (!url.trim()) return;
    setCoverBusy(true);
    try {
      const data = await apiCall(`/api/artists/${artist.id}/images`, {
        method: "POST",
        headers: jsonHeaders,
        body: j({ url, asCover: target }),
      });
      if (data.artist) onSaved(data.artist);
      if (target === "cover") setCoverLink("");
      else setAvatarLink("");
      notify(target === "cover" ? "Portada enlazada desde Drive ✔" : "Avatar enlazado desde Drive ✔");
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setCoverBusy(false);
    }
  };

  const toggleGenre = (g: string) =>
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g)
        ? f.genres.filter((x) => x !== g)
        : f.genres.length >= MAX_GENRES
          ? f.genres
          : [...f.genres, g],
    }));

  return (
    <form onSubmit={save} className="space-y-7">
      <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
        <div className="space-y-4">
          <div>
            <p className={labelCls}>Portada · enlace de Google Drive</p>
            <div className="relative w-full aspect-video border border-inkline bg-coal-2 overflow-hidden mb-2">
              {artist.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artist.coverUrl} alt="Portada" className="w-full h-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-bone-dim">
                  <IconImage className="w-6 h-6" />
                  <span className="font-tech text-[10px] tracking-widest">PORTADA DESDE DRIVE</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input className={`${inputCls} font-tech text-[10px]`} value={coverLink} onChange={(e) => setCoverLink(e.target.value)} placeholder="Pega el enlace compartido de Drive" />
              <button type="button" disabled={coverBusy || !coverLink.trim()} onClick={() => saveDriveImage(coverLink, "cover")} className="px-3 st-bg text-coal font-display font-bold text-xs disabled:opacity-40">{coverBusy ? "…" : "Usar"}</button>
            </div>
            <p className="mt-2 font-tech text-[9px] tracking-wider text-bone-dim">En Drive: Compartir → «Cualquier persona con el enlace» → Copiar enlace. ANTENA MUSICAL no guarda el archivo.</p>
          </div>
          <div>
            <p className={labelCls}>Avatar · enlace de Google Drive</p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-inkline bg-coal-2 shrink-0">
                {artist.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artist.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : <span className="w-full h-full flex items-center justify-center font-display font-bold st-text text-xl">{artist.name[0]}</span>}
              </div>
              <div className="flex-1 flex gap-2">
                <input className={`${inputCls} font-tech text-[10px]`} value={avatarLink} onChange={(e) => setAvatarLink(e.target.value)} placeholder="Enlace Drive" />
                <button type="button" disabled={coverBusy || !avatarLink.trim()} onClick={() => saveDriveImage(avatarLink, "avatar")} className="px-3 st-bg text-coal font-display font-bold text-xs disabled:opacity-40">Usar</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre artístico</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Lema</label>
              <input className={inputCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Ciudad base</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div>
            <span className={labelCls}>Géneros (hasta {MAX_GENRES})</span>
            <GenrePicker selected={form.genres} onToggle={toggleGenre} />
          </div>
          <div>
            <span className={labelCls}>Color de sintonía</span>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.hex}
                  type="button"
                  title={a.name}
                  onClick={() => setForm({ ...form, accent: a.hex })}
                  className={`w-8 h-8 border-2 transition-transform hover:scale-110 ${
                    form.accent === a.hex ? "border-bone scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: a.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Biografía</label>
        <textarea
          className="w-full bg-coal border border-inkline px-3.5 py-3 text-sm text-bone min-h-44 resize-y leading-relaxed focus:outline-none focus:border-signal transition-colors"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tu historia completa: orígenes, influencias, discos, giras, sueños…"
        />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["¿Cómo nació el proyecto?", "Tus 3 influencias clave", "La anécdota detrás de tu mejor canción", "¿Con quién sueñas colaborar?"].map(
            (idea) => (
              <span key={idea} className="font-tech text-[9px] tracking-wider px-2 py-1 border border-inkline text-bone-dim">
                ▸ {idea}
              </span>
            )
          )}
        </div>
      </div>

      <div className="border border-inkline bg-coal-2 p-5 space-y-4">
        <span className={labelCls}>Contrataciones</span>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-bone-dim mb-1.5">Teléfono de contacto</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+52 55 1234 5678"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-bone-dim mb-1.5">Booking / management</label>
            <input
              className={inputCls}
              value={form.booking}
              onChange={(e) => setForm({ ...form, booking: e.target.value })}
              placeholder="Agencia, email de booking, condiciones…"
            />
          </div>
        </div>
        <p className="font-tech text-[9px] tracking-wider text-bone-dim">
          Aparecen en tu estación y en el press kit — para que las salas y festivales te encuentren.
        </p>
      </div>

      <div className="border border-inkline bg-coal-2 p-5 space-y-4">
        <div>
          <span className={labelCls}>Tu press kit descargable (Google Drive)</span>
          <p className="text-sm text-bone-dim">
            Sube tu press kit propio a Drive (PDF, ZIP o una carpeta con fotos) y compártelo aquí. El público podrá
            descargarlo con un botón en tu estación.
          </p>
        </div>
        <div className="grid sm:grid-cols-[1.6fr_1fr] gap-4">
          <div>
            <label className="block text-xs font-semibold text-bone-dim mb-1.5">Enlace de Drive</label>
            <input
              className={`${inputCls} font-tech text-[11px]`}
              value={form.presskitUrl}
              onChange={(e) => setForm({ ...form, presskitUrl: e.target.value })}
              placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-bone-dim mb-1.5">Nombre visible</label>
            <input
              className={inputCls}
              value={form.presskitLabel}
              onChange={(e) => setForm({ ...form, presskitLabel: e.target.value })}
              placeholder="Ej. Press kit oficial 2026"
              maxLength={120}
            />
          </div>
        </div>
        <p className="font-tech text-[9px] tracking-wider text-bone-dim">
          Acepta archivos sueltos y carpetas · Compartir → «Cualquier persona con el enlace» · Déjalo vacío para quitarlo.
        </p>
      </div>

      <div>
        <span className={labelCls}>Redes y contacto</span>
        <div className="grid sm:grid-cols-2 gap-4">
          {SOCIAL_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-2.5">
              <span className="st-text shrink-0">{socialIcon(f.key)}</span>
              <input
                className="w-full bg-coal border border-inkline px-3 py-2.5 text-sm text-bone focus:outline-none focus:border-signal transition-colors"
                value={form.socials[f.key] || ""}
                onChange={(e) => setForm({ ...form, socials: { ...form.socials, [f.key]: e.target.value } })}
                placeholder={`${f.label} — ${f.placeholder}`}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="px-7 py-3 st-bg text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
      >
        {busy ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

/* ================= GALERÍA ================= */
function GalleryTab({
  artist,
  images,
  setImages,
  notify,
}: {
  artist: Artist;
  images: ImageRow[];
  setImages: React.Dispatch<React.SetStateAction<ImageRow[]>>;
  notify: (msg: string) => void;
}) {
  const [links, setLinks] = useState("");
  const [busyCount, setBusyCount] = useState(0);

  const addDriveLinks = async () => {
    const urls = links.split(/[\n,]+/).map((url) => url.trim()).filter(Boolean);
    if (!urls.length) return;
    setBusyCount(urls.length);
    let added = 0;
    for (const url of urls) {
      try {
        const data = await apiCall(`/api/artists/${artist.id}/images`, {
          method: "POST",
          headers: jsonHeaders,
          body: j({ url }),
        });
        setImages((cur) => [...cur, data.image]);
        added += 1;
      } catch (err) {
        notify((err as Error).message);
      } finally {
        setBusyCount((n) => n - 1);
      }
    }
    setLinks("");
    if (added) notify(`${added} ${added === 1 ? "imagen añadida" : "imágenes añadidas"} desde Google Drive ✔`);
  };

  const setCaption = async (img: ImageRow, caption: string) => {
    setImages((cur) => cur.map((x) => (x.id === img.id ? { ...x, caption } : x)));
    try {
      await apiCall(`/api/images/${img.id}?artistId=${artist.id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: j({ caption }),
      });
    } catch {
      /* silencioso */
    }
  };

  const remove = async (img: ImageRow) => {
    setImages((cur) => cur.filter((x) => x.id !== img.id));
    try {
      await apiCall(`/api/images/${img.id}?artistId=${artist.id}`, { method: "DELETE" });
      notify("Imagen retirada de la galería");
    } catch (err) {
      notify((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-inkline bg-coal-2 p-6 md:p-8">
        <IconImage className="w-8 h-8 mx-auto mb-3 text-signal" />
        <p className="font-display font-bold text-lg text-center mb-1">Añade fotos desde Google Drive</p>
        <p className="text-sm text-bone-dim text-center max-w-xl mx-auto mb-4">
          Guarda todas las que quieras en Drive. Aquí solo pegamos sus enlaces públicos: ANTENA MUSICAL no almacena archivos y no hay límite de imágenes.
        </p>
        <textarea
          className="w-full min-h-28 bg-coal border border-inkline px-3.5 py-3 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors font-tech"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder={"Pega un enlace público de Google Drive por línea\nhttps://drive.google.com/file/d/.../view?usp=sharing"}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={addDriveLinks} disabled={busyCount > 0 || !links.trim()} className="px-5 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50">
            {busyCount > 0 ? `Enlazando ${busyCount}…` : "Añadir enlaces a la galería"}
          </button>
          <span className="font-tech text-[9px] tracking-wider text-bone-dim">Drive → Compartir → Acceso general: «Cualquier persona con el enlace»</span>
        </div>
      </div>

      {images.length === 0 ? (
        <p className="text-center font-tech text-xs text-bone-dim py-6">
          Tu galería está vacía. Sube tu primera foto: los fans quieren verte.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border border-inkline bg-coal-2 group">
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.caption || "Foto"} className="w-full h-full object-cover" />
                <button
                  onClick={() => remove(img)}
                  className="absolute top-2 right-2 p-1.5 bg-coal/85 text-bone border border-inkline opacity-0 group-hover:opacity-100 transition-opacity hover:bg-signal hover:text-coal hover:border-signal"
                  aria-label="Eliminar imagen"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                className="w-full bg-transparent px-3 py-2.5 text-xs text-bone placeholder:text-bone-dim/50 focus:outline-none border-t border-inkline focus:bg-coal"
                defaultValue={img.caption}
                placeholder="Ponle título (ej. Ensayo en el garaje, 2025)"
                onBlur={(e) => e.target.value !== img.caption && setCaption(img, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= CANCIONES ================= */
function TracksTab({
  artist,
  tracks,
  setTracks,
  notify,
}: {
  artist: Artist;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  notify: (msg: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [dur, setDur] = useState("3:30");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const parsed = url.trim() ? parseMusicUrl(url) : null;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!parsed || !parsed.ok) {
      setErr(parsed && !parsed.ok ? parsed.error : "Pega un enlace de YouTube o Spotify.");
      return;
    }
    if (!title.trim()) {
      setErr("Dale un título a la pista (ej. «Neón tropical — sesión en vivo»).");
      return;
    }
    setBusy(true);
    try {
      const data = await apiCall(`/api/artists/${artist.id}/tracks`, {
        method: "POST",
        headers: jsonHeaders,
        body: j({ url: url.trim(), title: title.trim(), durationSec: parseDurationInput(dur) }),
      });
      setTracks((cur) => [...cur, data.track]);
      setUrl("");
      setTitle("");
      setDur("3:30");
      notify("Pista añadida a la rotación ✔");
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: Track) => {
    setTracks((cur) => cur.filter((x) => x.id !== t.id));
    try {
      await apiCall(`/api/tracks/${t.id}?artistId=${artist.id}`, { method: "DELETE" });
      notify("Pista retirada de la rotación");
    } catch (error) {
      notify((error as Error).message);
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= tracks.length) return;
    const next = [...tracks];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    setTracks(next);
    try {
      await apiCall(`/api/artists/${artist.id}/tracks/order`, {
        method: "POST",
        headers: jsonHeaders,
        body: j({ ids: next.map((t) => t.id) }),
      });
    } catch (error) {
      notify((error as Error).message);
      setTracks(tracks);
    }
  };

  /** Marca o desmarca la pista como «DESTACADA» (etiqueta neón en los reproductores). */
  const toggleFeatured = async (t: Track) => {
    const wanted = t.featured ? 0 : 1;
    setTracks((cur) => cur.map((x) => (x.id === t.id ? { ...x, featured: wanted } : x)));
    try {
      await apiCall(`/api/tracks/${t.id}?artistId=${artist.id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: j({ featured: wanted }),
      });
      notify(wanted ? "«"+t.title+"» destacada ✦" : "Destacada retirada");
    } catch (error) {
      notify((error as Error).message);
      setTracks((cur) => cur.map((x) => (x.id === t.id ? { ...x, featured: t.featured } : x)));
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="border border-inkline bg-coal-2 p-5 space-y-4">
        <p className="font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim">
          Añadir a la rotación · pega el enlace, nosotros lo sintonizamos
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              className={`${inputCls} pr-28 font-tech text-xs`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…  ·  https://open.spotify.com/track/…"
            />
            {parsed?.ok && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-coal border border-inkline font-tech text-[9px] tracking-widest text-bone">
                <PlatformChip platform={parsed.platform} className="w-3.5 h-3.5" />
                {platformLabel(parsed.platform).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-[1fr_130px_auto] gap-3">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la pista (ej. «Marea alta — oficial»)"
          />
          <input
            className={`${inputCls} font-tech`}
            value={dur}
            onChange={(e) => setDur(e.target.value)}
            placeholder="3:30"
            title="Duración aproximada (para el avance automático de pistas de Spotify)"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
          >
            {busy ? "Añadiendo…" : "Añadir pista"}
          </button>
        </div>
        {err && <p className="text-signal text-sm font-semibold">{err}</p>}
        {parsed?.ok && parsed.platform !== "youtube" && isPlayable(parsed.platform) && (
          <p className="border border-amber/50 bg-amber/10 px-3 py-2 text-xs text-amber leading-relaxed">
            ⚠ {platformLabel(parsed.platform)} se muestra dentro de tu estación, pero su reproductor{" "}
            <strong>no arranca solo</strong>: el oyente debe pulsar ▶. Para que tu radio suene sin cortes, añade también
            tus canciones en YouTube.
          </p>
        )}
        <p className="font-tech text-[9px] tracking-wider text-bone-dim leading-relaxed">
          SUENA SOLO ▸ YouTube (recomendado para tu radio 24/7)
          <br />
          SUENA CON PLAY MANUAL ▸ Spotify · SoundCloud · Deezer
          <br />
          ESCUCHA EXTERNA ▸ Apple Music · Bandcamp · Tidal · Amazon Music · Audiomack · cualquier otro enlace
        </p>
      </form>

      {tracks.length === 0 ? (
        <p className="text-center font-tech text-xs text-bone-dim py-6">
          Aún no hay pistas. Tu radio emite en silencio — añade tu primer enlace.
        </p>
      ) : (
        <ul className="divide-y divide-inkline border border-inkline">
          {tracks.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3 bg-panel hover:bg-coal-2 transition-colors group">
              <span className="font-tech text-[10px] text-bone-dim w-6 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <PlatformChip platform={t.platform} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">{t.title}</span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block font-tech text-[9px] tracking-wider text-bone-dim truncate hover:st-text transition-colors"
                >
                  {t.url}
                </a>
              </span>
              <span className="font-tech text-[10px] text-bone-dim tabular-nums hidden sm:block">≈ {t.durationSec}s</span>
              {t.featured ? <span className="featured-chip shrink-0">Destacada</span> : null}
              <button
                type="button"
                onClick={() => toggleFeatured(t)}
                className={`p-1.5 border font-tech text-[9px] tracking-[0.2em] uppercase shrink-0 transition-colors ${
                  t.featured
                    ? "border-[var(--st)] text-[var(--st)] bg-black/30"
                    : "border-inkline text-bone-dim hover:st-border hover:st-text"
                }`}
                title={t.featured ? "Quitar la etiqueta DESTACADA" : "Marcar como DESTACADA en tu radio"}
                aria-pressed={!!t.featured}
              >
                ★ Destacar
              </button>
              <span className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 text-bone-dim hover:text-bone disabled:opacity-20"
                  aria-label="Subir en la rotación"
                  title="Subir en la rotación"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === tracks.length - 1}
                  className="p-1.5 text-bone-dim hover:text-bone disabled:opacity-20"
                  aria-label="Bajar en la rotación"
                  title="Bajar en la rotación"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </button>
              </span>
              <button
                onClick={() => remove(t)}
                className="p-1.5 text-bone-dim border border-transparent hover:text-coal hover:bg-signal hover:border-signal transition-colors"
                aria-label="Eliminar pista"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="font-tech text-[9px] tracking-wider text-bone-dim">
        ▸ El orden de esta lista es el orden de tu rotación: usa las flechas al pasar el ratón por encima.
      </p>
    </div>
  );
}

/* ================= FECHAS ================= */
function ShowsTab({
  artist,
  shows,
  setShows,
  notify,
}: {
  artist: Artist;
  shows: Show[];
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  notify: (msg: string) => void;
}) {
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!date || !venue.trim()) {
      setErr("Necesitas fecha y recinto.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiCall(`/api/artists/${artist.id}/shows`, {
        method: "POST",
        headers: jsonHeaders,
        body: j({ date, venue: venue.trim(), city: city.trim() }),
      });
      setShows((cur) =>
        [...cur, data.show].sort((a, b) => new Date(a.showDate).getTime() - new Date(b.showDate).getTime())
      );
      setDate("");
      setVenue("");
      setCity("");
      notify("Fecha anunciada ✔");
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Show) => {
    setShows((cur) => cur.filter((x) => x.id !== s.id));
    try {
      await apiCall(`/api/shows/${s.id}?artistId=${artist.id}`, { method: "DELETE" });
      notify("Fecha cancelada");
    } catch (error) {
      notify((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="border border-inkline bg-coal-2 p-5 grid sm:grid-cols-[150px_1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" className={`${inputCls} [color-scheme:dark]`} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Recinto / evento</label>
          <input className={inputCls} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ej. Foro Subterráneo" />
        </div>
        <div>
          <label className={labelCls}>Ciudad</label>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej. CDMX" />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
        >
          {busy ? "…" : "Anunciar"}
        </button>
        {err && <p className="text-signal text-sm font-semibold sm:col-span-4">{err}</p>}
      </form>

      {shows.length === 0 ? (
        <p className="text-center font-tech text-xs text-bone-dim py-6">
          Sin fechas anunciadas. Cuando toques en vivo, anúncialo aquí y aparecerá en tu estación.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {shows.map((s) => {
            const f = formatDate(s.showDate);
            return (
              <li key={s.id} className="flex items-center gap-4 border border-inkline bg-panel px-4 py-3 group hover:st-border transition-colors">
                <div className="text-center shrink-0 w-14 border border-inkline bg-coal py-1.5">
                  <span className="block font-display font-extrabold text-xl leading-none st-text">{f.day}</span>
                  <span className="block font-tech text-[9px] tracking-widest text-bone-dim">
                    {f.month} {f.year}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold truncate">{s.venue}</p>
                  {s.city && <p className="font-tech text-[10px] tracking-widest text-bone-dim uppercase">{s.city}</p>}
                </div>
                <button
                  onClick={() => remove(s)}
                  className="p-1.5 text-bone-dim hover:text-coal hover:bg-signal transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Eliminar fecha"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ================= LETRAS ================= */
function LyricsTab({
  artist,
  tracks,
  setTracks,
  notify,
}: {
  artist: Artist;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  notify: (msg: string) => void;
}) {
  const [openId, setOpenId] = useState<number | null>(tracks[0]?.id ?? null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const drafts = useRef<Record<number, string>>({});

  const save = async (t: Track) => {
    const lyrics = drafts.current[t.id] ?? t.lyrics;
    setSavingId(t.id);
    try {
      await apiCall(`/api/tracks/${t.id}?artistId=${artist.id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: j({ lyrics }),
      });
      setTracks((cur) => cur.map((x) => (x.id === t.id ? { ...x, lyrics } : x)));
      notify("Letra guardada ✔");
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  if (tracks.length === 0) {
    return (
      <p className="text-center font-tech text-xs text-bone-dim py-8">
        Primero añade canciones en la pestaña «Canciones» — después podrás escribir sus letras aquí.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">
        Las canciones con letra aparecen en tu estación en la sección «Letras destacadas»
      </p>
      {tracks.map((t) => (
        <div key={t.id} className={`border transition-colors ${openId === t.id ? "st-border" : "border-inkline"} bg-coal-2`}>
          <button
            onClick={() => setOpenId(openId === t.id ? null : t.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            <PlatformChip platform={t.platform} />
            <span className="flex-1 font-display font-bold text-sm truncate">{t.title}</span>
            <span className={`font-tech text-[9px] tracking-widest uppercase ${t.lyrics ? "text-onair" : "text-bone-dim"}`}>
              {t.lyrics ? "Con letra ✔" : "Sin letra"}
            </span>
          </button>
          {openId === t.id && (
            <div className="px-4 pb-4 space-y-3">
              <textarea
                className="w-full bg-coal border border-inkline px-3.5 py-3 text-sm text-bone min-h-48 resize-y leading-relaxed focus:outline-none focus:border-signal transition-colors font-body"
                defaultValue={t.lyrics}
                onChange={(e) => {
                  drafts.current[t.id] = e.target.value;
                }}
                placeholder={"Escribe la letra aquí…\n\nVerso 1…\n\nCoro…"}
              />
              <button
                onClick={() => save(t)}
                disabled={savingId === t.id}
                className="px-5 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
              >
                {savingId === t.id ? "Guardando…" : "Guardar letra"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= CRÉDITOS ================= */
function CreditsTab({
  artist,
  onSaved,
  notify,
}: {
  artist: Artist;
  onSaved: (a: Artist) => void;
  notify: (msg: string) => void;
}) {
  const [credits, setCredits] = useState<{ role: string; name: string }[]>(artist.credits);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const persist = async (next: { role: string; name: string }[]) => {
    setBusy(true);
    try {
      const data = await apiCall(`/api/artists/${artist.id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: j({ patch: { credits: next } }),
      });
      onSaved(data.artist);
      setCredits(data.artist.credits);
      notify("Créditos actualizados ✔");
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !name.trim()) return;
    const next = [...credits, { role: role.trim(), name: name.trim() }];
    setRole("");
    setName("");
    persist(next);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="border border-inkline bg-coal-2 p-5 grid sm:grid-cols-[1fr_1.4fr_auto] gap-3 items-end">
        <div>
          <label className={labelCls}>Rol</label>
          <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ej. Producción, Mezcla, Featuring…" />
        </div>
        <div>
          <label className={labelCls}>Nombre / colaborador</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Estudio Sierra Alta" />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      {credits.length === 0 ? (
        <p className="text-center font-tech text-xs text-bone-dim py-6">
          Sin créditos todavía. Reconoce a quien te acompaña: productores, músicos invitados, sellos, fotógrafos…
        </p>
      ) : (
        <ul className="border border-inkline divide-y divide-inkline">
          {credits.map((c, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3 bg-panel group">
              <span className="font-tech text-[10px] tracking-widest uppercase text-bone-dim w-36 shrink-0 truncate">{c.role}</span>
              <span className="flex-1 text-sm font-semibold truncate">{c.name}</span>
              <button
                onClick={() => persist(credits.filter((_, j) => j !== i))}
                disabled={busy}
                className="p-1.5 text-bone-dim hover:text-coal hover:bg-signal transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Eliminar crédito"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================= STATS ================= */
function StatsTab({ tracks }: { tracks: Track[] }) {
  const sorted = [...tracks].sort((a, b) => b.plays - a.plays);
  const total = tracks.reduce((sum, t) => sum + t.plays, 0);
  const max = Math.max(1, ...tracks.map((t) => t.plays));

  if (tracks.length === 0) {
    return (
      <p className="text-center font-tech text-xs text-bone-dim py-8">
        Cuando tengas canciones y la gente las escuche, aquí verás cuántas reproducciones lleva cada una.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="border border-inkline bg-coal-2 px-5 py-4">
          <p className="font-display font-extrabold text-3xl st-text">{total.toLocaleString("es")}</p>
          <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim mt-1">Reproducciones totales</p>
        </div>
        <div className="border border-inkline bg-coal-2 px-5 py-4">
          <p className="font-display font-extrabold text-3xl">{tracks.length}</p>
          <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim mt-1">Pistas en rotación</p>
        </div>
        <div className="border border-inkline bg-coal-2 px-5 py-4">
          <p className="font-display font-extrabold text-3xl">{Math.round(total / tracks.length).toLocaleString("es")}</p>
          <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim mt-1">Media por pista</p>
        </div>
      </div>

      <div className="border border-inkline bg-panel">
        <p className="px-4 py-3 border-b border-inkline bg-coal-2 font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim">
          Oyentes por canción · se cuenta cada vez que alguien la reproduce en tu estación, en la videoteca o en Antena Musical Central
        </p>
        <div className="p-4 space-y-3.5">
          {sorted.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className="font-tech text-[10px] text-bone-dim w-6 tabular-nums shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <PlatformChip platform={t.platform} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold truncate">{t.title}</span>
                  <span className="font-tech text-[10px] text-bone-dim tabular-nums shrink-0">
                    {t.plays.toLocaleString("es")}
                  </span>
                </div>
                <div className="h-1.5 bg-coal border border-inkline overflow-hidden">
                  <div className="h-full st-bg" style={{ width: `${Math.max(3, (t.plays / max) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= VERIFICACIÓN (paloma azul) ================= */
type VerifyDoc = { id: number; url: string; label: string };

function VerifyTab({
  artist,
  onSaved,
  notify,
}: {
  artist: Artist;
  onSaved: (a: Artist) => void;
  notify: (msg: string) => void;
}) {
  const [status, setStatus] = useState(artist.verificationStatus);
  const [note, setNote] = useState(artist.verificationNote);
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(artist.verifiedAt);
  const [docs, setDocs] = useState<VerifyDoc[]>([]);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/artists/${artist.id}/verification`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.verificationStatus) {
          setStatus(d.verificationStatus);
          setNote(d.verificationNote ?? "");
          setVerifiedAt(d.verifiedAt ? new Date(d.verifiedAt) : null);
          setDocs(d.docs ?? []);
        }
      })
      .catch(() => {});
  }, [artist.id]);

  const request = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/artists/${artist.id}/verification`, {
        method: "POST",
        headers: jsonHeaders,
        body: j({ action: "request" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar");
      onSaved(data.artist);
      setStatus(data.artist.verificationStatus);
      setNote("");
      notify("Solicitud de verificación enviada ✔");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/artists/${artist.id}/verification/docs`, {
        method: "POST",
        headers: jsonHeaders,
        body: j({ url: url.trim(), label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enlazar");
      setDocs((c) => [...c, data.doc]);
      if (data.artist) {
        onSaved(data.artist);
        setStatus(data.artist.verificationStatus);
      }
      setUrl("");
      setLabel("");
      notify("Documento enlazado ✔");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeDoc = async (id: number) => {
    setDocs((c) => c.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/artists/${artist.id}/verification/docs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.artist) {
        onSaved(data.artist);
        setStatus(data.artist.verificationStatus);
      }
    } catch {
      /* silencioso */
    }
  };

  const docArea = (
    <div className="border border-inkline bg-coal-2 p-5 space-y-4">
      <p className="font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim">
        Documentos · enlaces de Google Drive
      </p>
      {docs.length > 0 && (
        <ul className="divide-y divide-inkline border border-inkline bg-coal">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 group">
              <span className="w-7 h-7 rounded-full bg-[#4DA6FF]/15 border border-[#4DA6FF]/40 flex items-center justify-center text-[#4DA6FF] font-display font-bold text-xs shrink-0">
                📄
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold truncate">{d.label || "Documento"}</span>
                <a href={d.url} target="_blank" rel="noreferrer" className="block font-tech text-[9px] text-bone-dim truncate hover:st-text transition-colors">
                  {d.url}
                </a>
              </span>
              <button
                onClick={() => removeDoc(d.id)}
                className="p-1.5 text-bone-dim hover:text-coal hover:bg-signal transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Quitar documento"
              >
                <IconTrash className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={addDoc} className="grid sm:grid-cols-[1fr_150px_auto] gap-2.5">
        <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enlace del documento (Drive → cualquiera con el enlace)" />
        <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Identificación oficial" maxLength={60} />
        <button type="submit" disabled={busy || !url.trim()} className="px-5 py-2.5 st-bg text-coal font-display font-bold text-sm disabled:opacity-40">
          {busy ? "…" : "Añadir"}
        </button>
      </form>
      <p className="font-tech text-[9px] tracking-wider text-bone-dim">
        Comparte los enlaces como «Cualquier persona con el enlace». No almacenamos tus documentos.
      </p>
    </div>
  );

  if (status === "approved") {
    return (
      <div className="border border-[#4DA6FF]/50 bg-[#4DA6FF]/10 p-8 text-center">
        <IconVerified className="w-16 h-16 mx-auto mb-4" />
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-[#4DA6FF] mb-2">Perfil verificado</p>
        <h3 className="font-display font-extrabold text-2xl md:text-3xl mb-2">Tu paloma azul está al aire</h3>
        <p className="text-bone-dim max-w-md mx-auto">
          {artist.name} aparece con la insignia de verificación en tu estación, en el directorio y en las búsquedas.
          {verifiedAt && (
            <span className="block mt-2 font-tech text-[10px] tracking-wider text-[#4DA6FF]">
              VERIFICADO EL {verifiedAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          )}
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="border border-signal/50 bg-signal/5 p-8 text-center space-y-4">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal">Solicitud rechazada</p>
        <h3 className="font-display font-extrabold text-2xl">Algo faltó en la revisión</h3>
        {note && (
          <div className="border border-signal/40 bg-coal p-4 text-left">
            <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-bone-dim mb-2">Nota del equipo</p>
            <p className="text-sm text-bone/90 leading-relaxed">{note}</p>
          </div>
        )}
        <button
          onClick={request}
          disabled={busy}
          className="px-6 py-3 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
        >
          {busy ? "Enviando…" : "Reintentar verificación"}
        </button>
      </div>
    );
  }

  if (status === "none") {
    return (
      <div className="border border-inkline bg-panel p-8 text-center space-y-4">
        <span className="mx-auto flex items-center justify-center w-16 h-16 rounded-full border border-[#4DA6FF]/50 bg-[#4DA6FF]/10">
          <IconVerified className="w-9 h-9 opacity-70" />
        </span>
        <h3 className="font-display font-extrabold text-2xl md:text-3xl">Verifica tu perfil</h3>
        <p className="text-bone-dim max-w-lg mx-auto leading-relaxed">
          La <span className="text-[#4DA6FF] font-semibold">paloma azul</span> confirma a fans y contratadores que esta
          estación es del artista real. El equipo de ANTENA MUSICAL revisará tus documentos y aprobará tu perfil.
        </p>
        <button
          onClick={request}
          disabled={busy}
          className="px-7 py-3.5 bg-[#4DA6FF] text-coal font-display font-extrabold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
        >
          {busy ? "Enviando…" : "Verificar mi perfil"}
        </button>
      </div>
    );
  }

  // requested o uploaded
  const isUploaded = status === "uploaded";
  return (
    <div className="space-y-5">
      <div className={`border p-6 ${isUploaded ? "border-[#4DA6FF]/50 bg-[#4DA6FF]/10" : "border-amber/50 bg-amber/10"}`}>
        <p className={`font-tech text-[11px] tracking-[0.3em] uppercase mb-1 ${isUploaded ? "text-[#4DA6FF]" : "text-amber"}`}>
          {isUploaded ? "Documentos recibidos — en revisión" : "Solicitud recibida"}
        </p>
        <h3 className="font-display font-extrabold text-2xl mb-1">{isUploaded ? "El equipo ya está revisando" : "Un paso más y listo"}</h3>
        <p className="text-sm text-bone/90 leading-relaxed">
          {isUploaded
            ? "Revisaremos tus documentos y te avisaremos aquí. Si falta algo, te lo pediremos con una nota."
            : "El equipo revisará tu solicitud. Cuando necesiten documentos, verás la petición aquí mismo y podrás enlazarlos."}
        </p>
      </div>

      {note && (
        <div className="border border-amber/50 bg-coal p-4">
          <p className="font-tech text-[9px] tracking-[0.25em] uppercase text-amber mb-2">El equipo te pide</p>
          <p className="text-sm text-bone/90 leading-relaxed whitespace-pre-line">{note}</p>
        </div>
      )}

      {docArea}
    </div>
  );
}

/* ================= SHELL ================= */
export default function ManagerPanel({ initial }: { initial: Full }) {
  const [artist, setArtist] = useState(initial.artist);
  const [tracks, setTracks] = useState(initial.tracks);
  const [images, setImages] = useState(initial.images);
  const [shows, setShows] = useState(initial.shows);
  const [tab, setTab] = useState<TabId>("galeria");
  const [toast, setToast] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionEmail, setSessionEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [gateError, setGateError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  /**
   * Si ya hay sesión válida (cookie), entra directo: no vuelve a pedir contraseña.
   * El dueño de la estación entra siempre; administración también puede editar.
   */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.logged && (d.artistId === artist.id || d.role === "admin")) {
          setAuthed(true);
          setSessionEmail(d.email ?? "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [artist.id]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const deleteStation = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: "DELETE",
        headers: jsonHeaders,
        body: j({ slug: artist.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || "No se pudo eliminar.");
        return;
      }
      window.location.href = "/";
    } catch {
      setDeleteError("Error de red. Inténtalo otra vez.");
    } finally {
      setDeleting(false);
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: jsonHeaders,
        body: j({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGateError(data.error || "Credenciales incorrectas.");
        return;
      }
      if (data.role !== "admin" && data.artistSlug && data.artistSlug !== artist.slug) {
        setGateError(`Este usuario pertenece a /${data.artistSlug}, no a /${artist.slug}.`);
        return;
      }
      setSessionEmail(data.email ?? "");
      setAuthed(true);
    } catch {
      setGateError("Error de red. Inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="max-w-md mx-auto border border-inkline bg-panel p-10 text-center">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-bone-dim animate-blink">
          Comprobando tu sesión…
        </p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto">
        <form
          onSubmit={login}
          className="border border-inkline bg-panel hard-shadow p-8 noise relative overflow-hidden"
        >
          <IconRadio className="w-8 h-8 text-signal mb-4" />
          <h1 className="font-display font-extrabold text-2xl mb-2">Panel de control</h1>
          <p className="text-sm text-bone-dim mb-6">
            Estás editando <span className="font-tech st-text">/{artist.slug}</span>. Entra con el email y la
            contraseña con los que creaste la estación.
          </p>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            autoComplete="email"
            className={`${inputCls} mb-4`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setGateError("");
            }}
            placeholder="hola@tucorreo.com"
            autoFocus
            required
          />
          <label className={labelCls}>Contraseña</label>
          <div className="relative mb-4">
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className={`${inputCls} pr-20`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setGateError("");
              }}
              placeholder="Tu contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 font-tech text-[9px] tracking-widest uppercase text-bone-dim hover:text-signal"
            >
              {show ? "ocultar" : "mostrar"}
            </button>
          </div>
          {gateError && <p className="text-signal text-xs font-semibold mb-3">{gateError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full px-6 py-3 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
          >
            {busy ? "Entrando…" : "Entrar a la cabina"}
          </button>
          <p className="mt-5 font-tech text-[10px] tracking-wider text-bone-dim text-center">
            ¿No tienes cuenta?{" "}
            <a href="/crear" className="text-signal hover:underline">
              Crea tu estación
            </a>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 border border-inkline bg-panel p-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-display font-bold transition-all whitespace-nowrap ${
                tab === id ? "st-bg text-coal" : "text-bone-dim hover:text-bone"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {sessionEmail && (
            <span className="hidden md:flex items-center gap-1.5 font-tech text-[9px] tracking-[0.2em] uppercase text-bone-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-onair" /> {sessionEmail}
            </span>
          )}
          <a
            href={`/${artist.slug}/presskit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-inkline text-sm font-semibold text-bone-dim hover:text-bone hover:border-bone/40 transition-colors"
          >
            ⬇ Press kit
          </a>
          <a
            href={`/${artist.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-inkline text-sm font-semibold text-bone-dim hover:text-bone hover:border-bone/40 transition-colors"
          >
            <IconEye className="w-4 h-4" /> Ver estación
          </a>
        </div>
      </div>

      <div className="border border-inkline bg-panel p-6 md:p-8 noise relative overflow-hidden">
        {tab === "perfil" && <ProfileTab artist={artist} onSaved={setArtist} notify={setToast} />}
        {tab === "galeria" && <GalleryTab artist={artist} images={images} setImages={setImages} notify={setToast} />}
        {tab === "canciones" && <TracksTab artist={artist} tracks={tracks} setTracks={setTracks} notify={setToast} />}
        {tab === "letras" && <LyricsTab artist={artist} tracks={tracks} setTracks={setTracks} notify={setToast} />}
        {tab === "creditos" && <CreditsTab artist={artist} onSaved={setArtist} notify={setToast} />}
        {tab === "fechas" && <ShowsTab artist={artist} shows={shows} setShows={setShows} notify={setToast} />}
        {tab === "stats" && <StatsTab tracks={tracks} />}
        {tab === "verificar" && <VerifyTab artist={artist} onSaved={setArtist} notify={setToast} />}
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[95] flex items-center gap-2 px-4 py-3 bg-bone text-coal font-display font-bold text-sm hard-shadow-signal">
          <IconCheck className="w-4 h-4" /> {toast}
        </div>
      )}

      <ChangePassword accent={artist.accent} />

      {/* zona peligrosa */}
      <div className="border border-signal/40 bg-signal/5 p-5">
        <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-signal mb-2">Zona peligrosa</p>
        {confirmingDelete ? (
          <div className="space-y-3">
            <p className="text-sm text-bone/90">
              Se borrará <strong>{artist.name}</strong>: pistas, fotos, fechas, chat y estadísticas. No hay vuelta
              atrás. Escribe <span className="font-tech text-signal">/{artist.slug}</span> para confirmar:
            </p>
            <input
              className="w-full bg-coal border border-inkline px-3.5 py-2.5 text-sm text-bone focus:outline-none focus:border-signal transition-colors font-tech"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={`/${artist.slug}`}
            />
            <div className="flex gap-3">
              <button
                onClick={deleteStation}
                disabled={deleting || deleteInput !== `/${artist.slug}`}
                className="px-5 py-2.5 bg-signal text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all disabled:opacity-40"
              >
                {deleting ? "Eliminando…" : "Sí, eliminar para siempre"}
              </button>
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteInput("");
                }}
                className="px-5 py-2.5 border border-inkline text-sm font-semibold text-bone-dim hover:text-bone transition-colors"
              >
                Cancelar
              </button>
            </div>
            {deleteError && <p className="text-signal text-xs font-semibold">{deleteError}</p>}
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="px-5 py-2.5 border border-signal/60 text-signal font-display font-bold text-sm hover:bg-signal hover:text-coal transition-colors"
          >
            Eliminar mi estación
          </button>
        )}
      </div>

      <p className="flex items-center justify-center gap-2 font-tech text-[10px] tracking-wider text-bone-dim text-center">
        <a href="/logout" className="hover:text-signal transition-colors underline-offset-2 hover:underline">
          Cerrar sesión
        </a>
        <span className="text-inkline">·</span>
        <span>¿Olvidaste la contraseña? Escríbenos y verificamos tu identidad.</span>
      </p>
    </div>
  );
}
