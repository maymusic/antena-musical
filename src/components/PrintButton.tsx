"use client";

export default function PrintButton({ label = "Descargar PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow print:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 16V4M6 10l6 6 6-6" />
        <path d="M4 20h16" />
      </svg>
      {label}
    </button>
  );
}
