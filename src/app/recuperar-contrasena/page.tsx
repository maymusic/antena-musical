"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { IconArrowRight, IconCheck } from "@/components/icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setDevUrl(data.developmentResetUrl ?? "");
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-md px-4 pt-16 pb-12">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Recuperación de acceso</p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[0.98]">
          Recupera tu cabina<span className="text-signal">.</span>
        </h1>
        <p className="mt-4 text-bone-dim">Escribe el email de tu cuenta y te mandaremos un enlace de un solo uso, válido por 60 minutos.</p>

        {done ? (
          <div className="mt-8 border border-onair/40 bg-panel hard-shadow p-6">
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-onair text-coal mb-4"><IconCheck className="w-5 h-5" /></span>
            <h2 className="font-display font-bold text-xl">Revisa tu correo</h2>
            <p className="mt-2 text-sm text-bone-dim leading-relaxed">
              Si existe una cuenta con ese email, recibirá instrucciones para restablecer la contraseña. Revisa también spam.
            </p>
            {devUrl && (
              <a href={devUrl} className="mt-5 block border border-amber/50 bg-amber/10 p-3 font-tech text-[10px] leading-relaxed text-amber break-all hover:underline">
                ENTORNO LOCAL · abrir enlace de recuperación →
              </a>
            )}
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-signal font-display font-bold hover:underline">
              Volver a entrar <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 border border-inkline bg-panel hard-shadow p-6 noise relative overflow-hidden space-y-4">
            <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim">Email de tu cuenta</label>
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full bg-coal border border-inkline px-3.5 py-3 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hola@tucorreo.com"
            />
            <button disabled={busy} className="w-full px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50">
              {busy ? "Enviando…" : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
