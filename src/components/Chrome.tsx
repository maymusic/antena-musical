"use client";

import { useState } from "react";
import Link from "next/link";
import { IconAntenna, IconArrowRight, IconClose } from "./icons";

import { useSession } from "./SessionProvider";

export function TopBar({ solid = false }: { solid?: boolean }) {
  const { session, logout } = useSession();
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);

  return (
    <header
      className={`sticky top-0 z-[70] border-b border-inkline backdrop-blur-md ${
        solid ? "bg-coal/95" : "bg-coal/80"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3 sm:gap-6">
        <Link href="/" onClick={close} className="flex items-center gap-2.5 group shrink-0 min-w-0">
          <span className="flex items-center justify-center w-9 h-9 bg-signal text-coal group-hover:rotate-[-6deg] transition-transform shrink-0">
            <IconAntenna className="w-5 h-5" />
          </span>
          <span className="font-display font-extrabold text-base sm:text-xl tracking-tight leading-none truncate">
            ANTENA MUSICAL
            <span className="block font-tech font-normal text-[8px] tracking-[0.4em] text-bone-dim">
              RADIOS DE ARTISTA
            </span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 ml-6 font-tech text-[11px] tracking-[0.18em] uppercase text-bone-dim">
          <Link href="/radio" className="flex items-center gap-1.5 text-bone hover:text-signal transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> En vivo
          </Link>
          <a href="/#estaciones" className="hover:text-signal transition-colors">Estaciones</a>
          <Link href="/buscar" className="hover:text-signal transition-colors">Buscar</Link>
          <Link href="/mi-dial" className="hover:text-signal transition-colors">Mi dial</Link>
          <a href="/#como-funciona" className="hover:text-signal transition-colors">Cómo funciona</a>
        </nav>
        {session.logged ? (
          <div className="ml-auto flex items-center gap-3">
            {session.role === "admin" && (
              <Link href="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-amber/50 text-amber text-sm font-semibold hover:bg-amber hover:text-coal transition-colors">Admin</Link>
            )}
            {session.artistSlug ? (
              <Link
                href={`/${session.artistSlug}/editar`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-inkline text-sm font-semibold text-bone hover:st-border hover:st-text transition-colors"
              >
                Mi estación
              </Link>
            ) : (
              <Link
                href="/crear"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-inkline text-sm font-semibold text-bone hover:st-border hover:st-text transition-colors"
              >
                Crear estación
              </Link>
            )}
            <button
              onClick={logout}
              className="font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:text-signal transition-colors"
            >
              Salir
            </button>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline font-tech text-[11px] tracking-[0.18em] uppercase text-bone-dim hover:text-signal transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/crear"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-signal text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow"
            >
              Crear mi estación <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Botón de menú: solo en móvil, donde la navegación no cabe. */}
        <button
          onClick={() => setMenu((v) => !v)}
          className="md:hidden ml-auto shrink-0 p-2 border border-inkline text-bone hover:border-signal hover:text-signal transition-colors"
          aria-label={menu ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menu}
        >
          {menu ? (
            <IconClose className="w-5 h-5" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ===== Menú desplegable (móvil) ===== */}
      {menu && (
        <div className="md:hidden border-t border-inkline bg-coal/98 backdrop-blur-md">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-col font-tech text-[12px] tracking-[0.18em] uppercase">
            <Link href="/radio" onClick={close} className="flex items-center gap-2 py-3 border-b border-inkline/60 text-bone hover:text-signal transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> En vivo
            </Link>
            <a href="/#estaciones" onClick={close} className="py-3 border-b border-inkline/60 text-bone-dim hover:text-signal transition-colors">Estaciones</a>
            <Link href="/buscar" onClick={close} className="py-3 border-b border-inkline/60 text-bone-dim hover:text-signal transition-colors">Buscar</Link>
            <Link href="/mi-dial" onClick={close} className="py-3 border-b border-inkline/60 text-bone-dim hover:text-signal transition-colors">Mi dial</Link>
            <a href="/#como-funciona" onClick={close} className="py-3 border-b border-inkline/60 text-bone-dim hover:text-signal transition-colors">Cómo funciona</a>

            {session.logged ? (
              <div className="flex flex-col gap-2 pt-4">
                {session.role === "admin" && (
                  <Link href="/admin" onClick={close} className="px-4 py-3 border border-amber/50 text-amber text-center font-semibold hover:bg-amber hover:text-coal transition-colors">
                    Admin
                  </Link>
                )}
                <Link
                  href={session.artistSlug ? `/${session.artistSlug}/editar` : "/crear"}
                  onClick={close}
                  className="px-4 py-3 border border-inkline text-bone text-center font-semibold hover:border-signal hover:text-signal transition-colors"
                >
                  {session.artistSlug ? "Mi estación" : "Crear estación"}
                </Link>
                <button
                  onClick={() => { close(); logout(); }}
                  className="px-4 py-3 text-bone-dim hover:text-signal transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/login" onClick={close} className="px-4 py-3 border border-inkline text-bone text-center font-semibold hover:border-signal hover:text-signal transition-colors">
                  Entrar
                </Link>
                <Link href="/crear" onClick={close} className="px-4 py-3 bg-signal text-coal text-center font-display font-bold hover:brightness-110 transition-all">
                  Crear mi estación
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-inkline bg-coal-2 mt-24">
      <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex items-center justify-center w-9 h-9 bg-signal text-coal">
              <IconAntenna className="w-5 h-5" />
            </span>
            <span className="font-display font-extrabold text-xl">ANTENA MUSICAL</span>
          </div>
          <p className="text-sm text-bone-dim max-w-sm leading-relaxed">
            Un espacio para que cada artista monte su propia emisora: su historia, sus fotos y sus canciones sonando
            como una radio, sin intermediarios.
          </p>
          <p className="mt-4 font-tech text-[10px] tracking-[0.3em] text-bone-dim/70 uppercase">
            Transmitiendo desde internet · 24/7
          </p>
        </div>
        <div>
          <h4 className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim mb-4">La red</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/radio" className="text-bone hover:text-signal transition-colors">Antena Musical Central (en vivo)</Link></li>
            <li><a href="/#estaciones" className="text-bone hover:text-signal transition-colors">Estaciones en línea</a></li>
            <li><a href="/#como-funciona" className="text-bone hover:text-signal transition-colors">Cómo funciona</a></li>
            <li><a href="/#ideas" className="text-bone hover:text-signal transition-colors">Qué puedes subir</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim mb-4">Tu cuenta</h4>
          <ul className="space-y-2.5 text-sm text-bone-dim">
            <li><Link href="/login" className="hover:text-signal transition-colors">Entrar al panel</Link></li>
            <li><Link href="/crear" className="hover:text-signal transition-colors">Crear una estación</Link></li>
            <li><Link href="/logout" className="hover:text-signal transition-colors">Cerrar sesión</Link></li>
            <li>Tu cuenta te abre la cabina desde cualquier dispositivo</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-inkline">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
          <p className="font-tech text-[10px] tracking-widest text-bone-dim flex flex-wrap gap-x-3 gap-y-1">
            <span>© {new Date().getFullYear()} ANTENA MUSICAL — HECHO PARA LA ESCENA INDEPENDIENTE · contacto@antenamusical.com</span>
            <Link href="/terminos" className="hover:text-signal transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-signal transition-colors">Privacidad</Link>
          </p>
          <p className="font-tech text-[10px] tracking-widest text-bone-dim flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-onair animate-pulse-dot" /> SEÑAL ESTABLE
          </p>
        </div>
      </div>
    </footer>
  );
}
