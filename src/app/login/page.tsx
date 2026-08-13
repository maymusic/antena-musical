"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { useSession } from "@/components/SessionProvider";
import { IconArrowRight, IconCheck } from "@/components/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, refresh } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.logged && !session.loading) {
      router.replace(session.artistSlug ? `/${session.artistSlug}/editar` : "/crear");
    }
  }, [session, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email || !password) {
      setErr("Email y contraseña son obligatorios.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No pudimos entrar.");
        return;
      }
      await refresh();
      router.replace(data.artistSlug ? `/${data.artistSlug}/editar` : "/crear");
    } catch {
      setErr("Error de red. Inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-coal border border-inkline px-3.5 py-3 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors";

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-md px-4 pt-16 pb-12">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Entrar</p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[0.98]">
          Bienvenido a tu cabina<span className="text-signal">.</span>
        </h1>
        <p className="mt-4 text-bone-dim">
          Introduce tu email y contraseña para gestionar tu estación: biografía, fotos, canciones y fechas.
        </p>

        <form onSubmit={submit} className="mt-8 border border-inkline bg-panel hard-shadow noise relative overflow-hidden p-6 space-y-5">
          <div>
            <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Email</label>
            <input
              className={inputCls}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hola@tucorreo.com"
              required
            />
          </div>
          <div>
            <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Contraseña</label>
            <div className="relative">
              <input
                className={`${inputCls} pr-20`}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La que elegiste al crear la estación"
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
          </div>
          {err && <p className="text-signal text-sm font-semibold">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
          >
            {busy ? "Entrando…" : "Entrar al panel"} <IconArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-sm text-bone-dim text-center space-y-2">
          <p>
            ¿Olvidaste tu contraseña?{" "}
            <Link href="/recuperar-contrasena" className="text-signal hover:underline font-semibold">Recuperar acceso</Link>
          </p>
          <p>
            ¿Aún no tienes estación?{" "}
            <Link href="/crear" className="text-signal hover:underline font-semibold">Crear la mía</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
