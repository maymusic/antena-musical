"use client";

import { useState } from "react";

/** Cambio de contraseña estando dentro: pide la actual y renueva la sesión. */
export default function ChangePassword({ accent = "#FF4D00" }: { accent?: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const inputCls =
    "w-full bg-coal border border-inkline px-3.5 py-2.5 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (next.length < 8) return setErr("La nueva contraseña necesita al menos 8 caracteres.");
    if (next !== confirm) return setErr("La confirmación no coincide.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo cambiar.");
        return;
      }
      setMsg("Contraseña actualizada ✔ — sigue tu sesión abierta.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setErr("Error de red. Inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-inkline bg-panel" style={{ ["--st" as string]: accent }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left bg-coal-2 border-b border-inkline"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 st-text shrink-0">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span className="flex-1 font-display font-bold text-sm">
          Cambiar mi contraseña
          <span className="block font-tech font-normal text-[9px] tracking-[0.25em] uppercase text-bone-dim">
            Seguridad de tu cuenta
          </span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Contraseña actual</label>
            <input type={show ? "text" : "password"} autoComplete="current-password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Nueva</label>
              <input type={show ? "text" : "password"} autoComplete="new-password" minLength={8} className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} required />
            </div>
            <div>
              <label className="block font-tech text-[10px] tracking-[0.25em] uppercase text-bone-dim mb-2">Confirmar</label>
              <input type={show ? "text" : "password"} autoComplete="new-password" minLength={8} className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
          </div>
          <label className="flex items-center gap-2 font-tech text-[10px] tracking-wider text-bone-dim cursor-pointer">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-[var(--st)]" />
            Mostrar contraseñas
          </label>
          {err && <p className="text-signal text-sm font-semibold">{err}</p>}
          {msg && <p className="text-onair text-sm font-semibold">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Actualizar contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
