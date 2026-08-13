import type { Metadata } from "next";
import { TopBar, Footer } from "@/components/Chrome";
import CreateStationForm from "@/components/CreateStationForm";
import Reveal from "@/components/Reveal";
import { IconCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Crear mi estación — ANTENA MUSICAL",
  description: "Reclama tu frecuencia: nombre, géneros, historia y color de sintonía.",
};

const CHECKLIST = [
  "Nombre artístico y URL propia (tu frecuencia)",
  "Hasta 3 géneros y tu ciudad base",
  "Tu historia — orígenes, influencias, anécdotas",
  "Color de sintonía: tu estación, tu paleta",
  "Redes: Instagram, TikTok, YouTube, X, Bandcamp, email",
  "Después: portada, avatar, galería, canciones y fechas",
];

export default function CrearPage() {
  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-6xl px-4 pt-14 pb-8">
        <Reveal className="max-w-2xl mb-12">
          <p className="font-tech text-[11px] tracking-[0.3em] uppercase text-signal mb-3">Alta de emisora</p>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[0.98]">
            Reclama tu frecuencia<span className="text-signal">.</span>
          </h1>
          <p className="mt-5 text-lg text-bone-dim leading-relaxed">
            Rellena la solicitud y tu estación entra al dial al instante. Recibirás un{" "}
            <strong className="text-bone">código de artista</strong> — guárdalo: es la llave para editar tu espacio.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[1.7fr_1fr] gap-10 items-start">
          <Reveal delay={100}>
            <CreateStationForm />
          </Reveal>
          <Reveal delay={200} className="lg:sticky lg:top-24 space-y-6">
            <div className="border border-inkline bg-panel p-6 hard-shadow noise relative overflow-hidden">
              <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim mb-4">Tu solicitud incluye</p>
              <ul className="space-y-3">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-bone">
                    <IconCheck className="w-4 h-4 text-onair shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-inkline bg-coal-2 p-6">
              <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-amber mb-3">Recuerda</p>
              <p className="text-sm text-bone-dim leading-relaxed">
                En ANTENA MUSICAL <strong className="text-bone">solo se suben imágenes</strong>. Tu música se enlaza desde YouTube y
                Spotify — así tu radio siempre suena con la mejor calidad y sin almacenar archivos pesados.
              </p>
              <p className="text-sm text-bone-dim leading-relaxed mt-3">
                Usa un <strong className="text-bone">email al que siempre tengas acceso</strong>: con él entras al
                panel desde cualquier dispositivo.
              </p>
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
