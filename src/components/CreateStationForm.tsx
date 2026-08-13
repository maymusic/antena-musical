"use client";

import { useMemo, useState } from "react";
import { ACCENTS, MAX_GENRES, SOCIAL_FIELDS, slugify } from "@/lib/parse";
import GenrePicker from "./GenrePicker";
import { IconAntenna, IconArrowRight, IconCheck } from "./icons";

export default function CreateStationForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0].hex);
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShow, setPasswordShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ slug: string } | null>(null);

  const previewSlug = useMemo(() => slugify(name), [name]);

  const toggleGenre = (g: string) => {
    setGenres((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : cur.length >= MAX_GENRES ? cur : [...cur, g]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const finalSlug = slugTouched ? slug : previewSlug;
    if (name.trim().length < 2) return setError("Ponle nombre a tu estación (mínimo 2 letras).");
    if (!finalSlug) return setError("Necesitas una frecuencia (slug) válida.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return setError("Indica un email válido (lo usarás para entrar al panel).");
    }
    if (password.length < 8) {
      return setError("La contraseña tiene que tener al menos 8 caracteres.");
    }
    if (password.length > 128) {
      return setError("La contraseña es demasiado larga.");
    }
    setBusy(true);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: finalSlug,
          tagline: tagline.trim(),
          city: city.trim(),
          genres,
          bio: bio.trim(),
          accent,
          socials,
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Algo falló al crear la estación.");
        return;
      }
      setDone({ slug: finalSlug });
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="border border-onair/40 bg-panel hard-shadow p-8 md:p-10 text-center relative noise overflow-hidden">
        <div className="mx-auto w-16 h-16 rounded-full bg-onair text-coal flex items-center justify-center mb-5">
          <IconCheck className="w-8 h-8" />
        </div>
        <p className="font-tech text-[11px] tracking-[0.3em] text-onair uppercase mb-3">Estación registrada en el dial</p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-2">¡Ya estás en el aire!</h2>
        <p className="text-bone-dim max-w-md mx-auto mb-8">
          Tu frecuencia es <span className="font-tech text-signal">antenamusical.com/{done.slug}</span>. Tu cuenta de artista ya quedó creada y podrás entrar a tu cabina desde cualquier dispositivo.
        </p>
        <p className="text-bone-dim max-w-md mx-auto mb-6 text-sm">
          Ya puedes entrar al panel de control con tu email y contraseña desde cualquier dispositivo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/${done.slug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow"
          >
            Ver mi estación <IconArrowRight className="w-4 h-4" />
          </a>
          <a
            href={`/${done.slug}/editar`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-bone/30 text-bone font-display font-bold hover:border-signal hover:text-signal transition-colors"
          >
            Subir fotos y canciones
          </a>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full bg-coal border border-inkline px-3.5 py-2.5 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors";
  const labelCls = "block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2";

  return (
    <form onSubmit={submit} className="border border-inkline bg-panel hard-shadow noise relative overflow-hidden">
      <div className="px-6 py-4 border-b border-inkline bg-coal-2 flex items-center gap-2.5">
        <IconAntenna className="w-4 h-4 text-signal" />
        <span className="font-tech text-[11px] tracking-[0.25em] uppercase text-bone-dim">
          Solicitud de frecuencia · Formulario 01-A
        </span>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* identidad */}
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls} htmlFor="f-name">Nombre artístico *</label>
            <input
              id="f-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Neblina Norte"
              maxLength={48}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="f-slug">Tu frecuencia (URL) *</label>
            <div className="flex items-stretch">
              <span className="flex items-center px-3 border border-r-0 border-inkline bg-coal-2 font-tech text-xs text-bone-dim">
                antena/
              </span>
              <input
                id="f-slug"
                className={`${inputCls} font-tech`}
                value={slugTouched ? slug : previewSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="tu-nombre"
                maxLength={40}
              />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="f-tag">Lema de la estación</label>
            <input
              id="f-tag"
              className={inputCls}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ej. Pop nostálgico desde el puerto"
              maxLength={90}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="f-city">Ciudad base</label>
            <input
              id="f-city"
              className={inputCls}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Monterrey, MX"
              maxLength={60}
            />
          </div>
        </div>

        {/* géneros */}
        <div>
          <span className={labelCls}>Géneros (hasta {MAX_GENRES})</span>
          <GenrePicker selected={genres} onToggle={toggleGenre} />
        </div>

        {/* bio */}
        <div>
          <label className={labelCls} htmlFor="f-bio">Tu historia (biografía)</label>
          <textarea
            id="f-bio"
            className={`${inputCls} min-h-32 resize-y leading-relaxed`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="¿Cuándo empezaste? ¿Con quién tocas? ¿Qué suena en tu cabeza? Cuéntalo como se lo contarías a un fan en un bar."
            maxLength={4000}
          />
          <p className="mt-2 font-tech text-[10px] tracking-wider text-bone-dim">
            IDEA ▸ orígenes · influencias · anécdotas de grabación · a qué suena, en tus palabras
          </p>
        </div>

        {/* acento */}
        <div>
          <span className={labelCls}>Color de sintonía</span>
          <div className="flex flex-wrap gap-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a.hex}
                type="button"
                title={a.name}
                onClick={() => setAccent(a.hex)}
                className={`w-9 h-9 border-2 transition-transform hover:scale-110 ${
                  accent === a.hex ? "border-bone scale-110 hard-shadow" : "border-transparent"
                }`}
                style={{ backgroundColor: a.hex }}
                aria-label={`Color ${a.name}`}
              />
            ))}
          </div>
          <p className="mt-2 font-tech text-[10px] tracking-wider text-bone-dim">
            Este color pinta tu reproductor, tus botones y tu ON AIR.
          </p>
        </div>

        {/* redes */}
        <div>
          <span className={labelCls}>Redes y contacto</span>
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-bone-dim mb-1.5" htmlFor={`s-${f.key}`}>
                  {f.label}
                </label>
                <input
                  id={`s-${f.key}`}
                  className={inputCls}
                  value={socials[f.key] || ""}
                  onChange={(e) => setSocials((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* acceso */}
        <div className="border border-inkline bg-coal-2 p-5 space-y-4">
          <div>
            <span className={labelCls}>Tu cuenta de artista</span>
            <p className="text-sm text-bone-dim">
              Email y contraseña para entrar al panel de control desde cualquier dispositivo.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-bone-dim mb-1.5" htmlFor="f-email">
                Email *
              </label>
              <input
                id="f-email"
                type="email"
                autoComplete="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hola@tucorreo.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-bone-dim mb-1.5" htmlFor="f-password">
                Contraseña * (mín. 8 caracteres)
              </label>
              <div className="relative">
                <input
                  id="f-password"
                  type={passwordShow ? "text" : "password"}
                  autoComplete="new-password"
                  className={`${inputCls} pr-16`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Algo sólido"
                  required
                  minLength={8}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setPasswordShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 font-tech text-[9px] tracking-widest uppercase text-bone-dim hover:text-signal"
                >
                  {passwordShow ? "ocultar" : "mostrar"}
                </button>
              </div>
              <p className="mt-1.5 font-tech text-[9px] tracking-wider text-bone-dim">
                Tu contraseña se guarda cifrada y no podemos recuperarla — guárdala en un gestor.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="border border-signal/50 bg-signal/10 text-signal px-4 py-3 text-sm font-semibold">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-signal text-coal font-display font-extrabold text-lg tracking-wide hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
        >
          {busy ? "Sintonizando…" : "Reclamar mi frecuencia"}
          <IconArrowRight className="w-5 h-5" />
        </button>
        <p className="font-tech text-[10px] tracking-wider text-bone-dim text-center">
          Después podrás subir tu portada, fotos, enlaces de YouTube/Spotify y fechas de concierto.
        </p>
      </div>
    </form>
  );
}
