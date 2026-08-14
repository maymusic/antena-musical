import type { Metadata } from "next";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import PlaylistsClient from "@/components/PlaylistsClient";
import { IconArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Mis playlists — ANTENA MUSICAL",
  description: "Crea tus listas personales con canciones de tus artistas favoritos y publícalas para compartirlas.",
};

export default function MisPlaylistsPage() {
  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-10">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Tus mezclas personales</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.98]">
          Mis playlists<span className="text-signal">.</span>
        </h1>
        <p className="mt-4 mb-4 text-bone-dim max-w-2xl">
          Guarda canciones de varios artistas, escúchalas con el mezclador retro y pulsa{" "}
          <strong className="text-bone">Publicar</strong> para que aparezcan en el directorio público.
        </p>
        <Link
          href="/playlists"
          className="inline-flex items-center gap-2 mb-10 font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:text-signal transition-colors"
        >
          Ver playlists públicas de la comunidad <IconArrowRight className="w-3.5 h-3.5" />
        </Link>
        <PlaylistsClient />
      </main>
      <Footer />
    </div>
  );
}
