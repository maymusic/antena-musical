"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { id: number; nick: string; body: string; createdAt: string };

/** Chat en vivo de la estación: los oyentes conversan mientras suena la radio. */
export default function ChatPanel({
  artistId,
  artistName,
  accent,
}: {
  artistId: number;
  artistName: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nick, setNick] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNick(localStorage.getItem("antena:nick") ?? "");
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/artists/${artistId}/chat`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages)) setMessages(data.messages);
      } catch {
        /* noop */
      }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, artistId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!nick.trim() || !text.trim()) {
      setErr("Escribe tu nombre y un mensaje.");
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem("antena:nick", nick.trim());
      const res = await fetch(`/api/artists/${artistId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: nick.trim(), body: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo enviar.");
        return;
      }
      setMessages((cur) => [...cur, data.message]);
      setText("");
    } catch {
      setErr("Error de red.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ["--st" as string]: accent }} className="border border-inkline bg-panel hard-shadow noise relative overflow-hidden">
      {/* cabecera */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-coal-2 border-b border-inkline text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-onair animate-pulse-dot" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 st-text">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span className="flex-1 font-display font-bold text-sm md:text-base">
          Chat de la estación
          <span className="block font-tech font-normal text-[9px] tracking-[0.25em] uppercase text-bone-dim">
            Los oyentes de {artistName}, en vivo
          </span>
        </span>
        <span className="font-tech text-[9px] tracking-widest text-bone-dim">{messages.length} msgs</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {/* mensajes */}
          <div ref={scrollRef} className="h-64 overflow-y-auto bg-coal border border-inkline p-3 space-y-2.5">
            {messages.length === 0 && (
              <p className="font-tech text-[11px] text-bone-dim text-center pt-8">
                Silencio en la sala… sé la primera persona en saludar. 📻
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <span className="shrink-0 w-8 h-8 rounded-full st-bg/15 border st-border flex items-center justify-center font-display font-bold text-xs st-text">
                  {m.nick[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-tech text-[9px] tracking-widest uppercase text-bone-dim">
                    {m.nick} · {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-bone/90 leading-snug break-words">{m.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* formulario */}
          <form onSubmit={send} className="flex flex-col sm:flex-row gap-2">
            <input
              className="sm:w-32 shrink-0 bg-coal border border-inkline px-3 py-2.5 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Tu nombre"
              maxLength={24}
            />
            <input
              className="flex-1 bg-coal border border-inkline px-3 py-2.5 text-sm text-bone placeholder:text-bone-dim/50 focus:outline-none focus:border-signal transition-colors"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué le dices a la sala?"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 st-bg text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
          {err && <p className="text-signal text-xs font-semibold">{err}</p>}
          <p className="font-tech text-[9px] tracking-wider text-bone-dim">
            Los mensajes se actualizan solos cada 4 s · sé amable: esto es radio pública.
          </p>
        </div>
      )}
    </div>
  );
}
