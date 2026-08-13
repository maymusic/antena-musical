"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { IconCheck } from "@/components/icons";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Usa al menos 8 caracteres.");
    if (password !== confirm) return setErr("Las contraseñas no coinciden.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) return setErr(data.error || "No se pudo cambiar la contraseña.");
      setDone(true);
    } catch {
      setErr("Error de red. Inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-md px-4 pt-16 pb-12">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Nueva contraseña</p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[0.98]">
          Cambia la llave<span className="text-signal">.</span>
        </h1>
        {done ? (
          <div className="mt-8 border border-onair/40 bg-panel hard-shadow p-6">
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-onair text-coal mb-4"><IconCheck className="w-5 h-5" /></span>
            <h2 className="font-display font-bold text-xl">Contraseña actualizada</h2>
            <p className="mt-2 text-sm text-bone-dim">Ya puedes entrar a tu cabina con tu nueva contraseña.</p>
            <Link href="/login" className="mt-6 inline-flex px-5 py-3 bg-signal text-coal font-display font-bold">Entrar al panel</Link>
          </div>
        ) : !token ? (
          <div className="mt-8 border border-signal/40 bg-panel p-6">
            <p className="text-signal font-semibold">Falta el enlace de recuperación.</p>
            <Link href="/recuperar-contrasena" className="mt-4 inline-block text-bone hover:text-signal underline">Pedir uno nuevo</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 border border-inkline bg-panel hard-shadow p-6 noise relative overflow-hidden space-y-4">
            <div>
              <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Nueva contraseña</label>
              <div className="relative">
                <input type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} className="w-full bg-coal border border-inkline px-3.5 py-3 pr-20 text-sm text-bone focus:outline-none focus:border-signal" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 font-tech text-[9px] tracking-widest text-bone-dim hover:text-signal">{show ? "OCULTAR" : "MOSTRAR"}</button>
              </div>
            </div>
            <div>
              <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Confirma la contraseña</label>
              <input type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} className="w-full bg-coal border border-inkline px-3.5 py-3 text-sm text-bone focus:outline-none focus:border-signal" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {err && <p className="text-signal text-sm font-semibold">{err}</p>}
            <button disabled={busy} className="w-full px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all disabled:opacity-50">{busy ? "Actualizando…" : "Guardar nueva contraseña"}</button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-coal" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
