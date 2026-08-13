import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { IconAntenna, IconArrowRight } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar solid />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg">
          <div className="dial-face border border-inkline inline-block px-6 py-3 mb-8">
            <span className="font-tech text-sm tracking-[0.3em] text-amber">···.- — — ··· SIN SEÑAL</span>
          </div>
          <h1 className="font-display font-extrabold text-6xl md:text-7xl tracking-tight mb-4">
            Ruido blanco<span className="text-signal">.</span>
          </h1>
          <p className="text-bone-dim text-lg mb-8">
            Esta frecuencia no existe (todavía). Puede que la estación cambió de dial… o que está esperando a que la
            reclames tú.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow"
            >
              <IconAntenna className="w-5 h-5" /> Volver al dial
            </Link>
            <Link
              href="/crear"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-bone/30 text-bone font-display font-bold hover:border-signal hover:text-signal transition-colors"
            >
              Crear esta estación <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
