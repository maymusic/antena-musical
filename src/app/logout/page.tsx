"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar, Footer } from "@/components/Chrome";
import { useSession } from "@/components/SessionProvider";
import { IconArrowRight, IconCheck } from "@/components/icons";

export default function LogoutPage() {
  const { session, logout, refresh } = useSession();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session.logged && !session.loading && done) {
      router.replace("/");
    }
  }, [session, router, done]);

  const doLogout = async () => {
    setBusy(true);
    setDone(true);
    await logout();
  };

  return (
    <div className="min-h-screen">
      <TopBar solid />
      <main className="mx-auto max-w-md px-4 pt-16 pb-12">
        <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-[0.98]">
          {session.logged ? "Cerrar sesión" : done ? "Sesión cerrada" : "Ya no hay sesión"}
        </h1>
        {session.logged ? (
          <>
            <p className="mt-5 text-bone-dim">
              Estás dentro como{" "}
              <span className="font-tech text-signal">{session.email}</span>. ¿Quieres cerrar la sesión en este navegador?
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={doLogout}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-signal text-coal font-display font-bold hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow disabled:opacity-50"
              >
                {busy ? "Cerrando…" : "Cerrar sesión"}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-bone/30 text-bone font-display font-bold hover:border-signal hover:text-signal transition-colors"
              >
                Volver
              </Link>
            </div>
          </>
        ) : (
          <div className="mt-8">
            {done && (
              <div className="flex items-start gap-3 border border-onair/40 bg-panel p-5 mb-5">
                <span className="w-10 h-10 rounded-full bg-onair text-coal flex items-center justify-center shrink-0">
                  <IconCheck className="w-5 h-5" />
                </span>
                <p className="text-bone">Has cerrado sesión correctamente. ¡Vuelve cuando quieras!</p>
              </div>
            )}
            <p className="text-bone-dim">
              No hay ninguna sesión abierta en este navegador. Puedes{" "}
              <Link href="/login" className="text-signal hover:underline font-semibold">
                iniciar sesión
              </Link>{" "}
              o{" "}
              <Link href="/crear" className="text-signal hover:underline font-semibold">
                crear una estación nueva
              </Link>
              .
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 border border-bone/30 text-bone font-display font-bold hover:border-signal hover:text-signal transition-colors"
            >
              Volver al dial <IconArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
