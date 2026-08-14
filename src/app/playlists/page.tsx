import type { Metadata } from "next";
import { TopBar, Footer } from "@/components/Chrome";
import PlaylistsClient from "@/components/PlaylistsClient";

export const metadata: Metadata = {
  title: "Mis playlists — ANTENA MUSICAL",
  description: "Crea playlists personales con canciones de tus artistas favoritos en Antena Musical.",
};

export default function PlaylistsPage() {
  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-10">
        <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Tus mezclas personales</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.98]">
          Mis playlists<span className="text-signal">.</span>
        </h1>
        <p className="mt-4 mb-10 text-bone-dim max-w-2xl">
          Guarda canciones de varios artistas, arma tus propias listas y reproduce las pistas de YouTube desde el reproductor persistente.
        </p>
        <PlaylistsClient />
      </main>
      <Footer />
    </div>
  );
}
