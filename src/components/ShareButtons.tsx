"use client";

import { useState } from "react";

/** Botones para compartir la estación: copiar, WhatsApp, X y compartir nativo. */
export default function ShareButtons({
  title,
  accent,
}: {
  title: string;
  accent: string;
}) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const url = () =>
    typeof window !== "undefined" ? window.location.href : "";
  const text = () => `📻 ${title} tiene su propia radio online — escúchala en ANTENA MUSICAL`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text(), url: url() });
      } catch {
        /* cancelado */
      }
    } else {
      setShareOpen((s) => !s);
    }
  };

  return (
    <div className="relative" style={{ ["--st" as string]: accent }}>
      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          className="p-2.5 border border-bone/25 bg-coal/60 text-bone hover:st-border hover:st-text transition-colors"
          title="Copiar enlace"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 st-text">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
              <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
            </svg>
          )}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${text()}: ${url()}`)}`}
          target="_blank"
          rel="noreferrer"
          className="p-2.5 border border-bone/25 bg-coal/60 text-bone hover:st-border hover:st-text transition-colors"
          title="Compartir por WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.4 14.2c-.2.7-1.3 1.3-1.8 1.3-.5.1-1 .2-3.4-.7-2.9-1.2-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.2.1.4 0 .6-.1.2-.2.4-.3.5l-.5.6c-.2.2-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.9 1.2 2.2 1.3.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.6z" />
          </svg>
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text())}&url=${encodeURIComponent(url())}`}
          target="_blank"
          rel="noreferrer"
          className="p-2.5 border border-bone/25 bg-coal/60 text-bone hover:st-border hover:st-text transition-colors"
          title="Compartir en X"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z" />
          </svg>
        </a>
        <button
          onClick={nativeShare}
          className="p-2.5 border border-bone/25 bg-coal/60 text-bone hover:st-border hover:st-text transition-colors"
          title="Más opciones"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
      {shareOpen && !navigator.share && (
        <div className="absolute right-0 top-12 z-20 border border-inkline bg-panel p-4 w-64 hard-shadow">
          <p className="font-tech text-[10px] tracking-widest uppercase text-bone-dim mb-2">Enlace de la estación</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={url()}
              className="flex-1 bg-coal border border-inkline px-2 py-2 font-tech text-[10px] text-bone focus:outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button onClick={copy} className="px-3 py-2 st-bg text-coal font-display font-bold text-xs">
              {copied ? "✔" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
