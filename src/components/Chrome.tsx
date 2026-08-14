"use client";

import Link from "next/link";
import { useState } from "react";
import { IconAntenna, IconArrowRight } from "./icons";

import { useSession } from "./SessionProvider";

export function TopBar({ solid = false }: { solid?: boolean }) {
  const { session, logout } = useSession();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-[90] border-b border-inkline bg-coal/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <span className="flex items-center justify-center w-9 h-9 bg-signal text-coal group-hover:rotate-[-6deg] transition-transform">
            <IconAntenna className="w-5 h-5" />
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight leading-none">
            ANTENA MUSICAL
            <span className="block font-tech font-normal text-[8px] tracking-[0.4em] text-bone-dim">
              RADIOS DE ARTISTA
            </span>
          </span>
        </Link>

        {/* Botón hamburguesa móvil */}
        <button
          className="md:hidden ml-auto p-2.5 border border-inkline text-bone-dim hover:text-bone"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>

        {/* Navegación principal - solo visible cuando open=true en móvil */}
        <nav
          className={`
            ${open ? "flex" : "hidden"} 
            md:flex 
            absolute md:static 
            top-16 left-0 right-0 
            z-[95] 
            bg-coal/98 md:bg-transparent 
            border-b md:border-none border-inkline 
            md:ml-6 
            p-4 md:p-0 
            flex-col md:flex-row 
            items-stretch md:items-center 
            gap-1 md:gap-5 
            text-[14px] md:text-[11px] 
            tracking-[0.18em] uppercase text-bone-dim font-tech
          `}
        >
          <Link href="/radio" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors flex items-center gap-2 border-b md:border-none border-inkline/30">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-blink" /> En vivo
          </Link>
          <a href="/#estaciones" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors border-b md:border-none border-inkline/30">Estaciones</a>
          <Link href="/buscar" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors border-b md:border-none border-inkline/30">Buscar</Link>
          <Link href="/playlists" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors border-b md:border-none border-inkline/30">Playlists</Link>
          {session.logged && (
            <>
              <Link href="/mi-dial" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors border-b md:border-none border-inkline/30">Mi dial</Link>
              <Link href="/mis-playlists" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors border-b md:border-none border-inkline/30">Mis playlists</Link>
            </>
          )}
          <a href="/#como-funciona" onClick={closeMenu} className="px-4 py-3 md:py-0 hover:text-signal transition-colors">Cómo funciona</a>
        </nav>

        {/* Botones de la derecha - OCULTOS en móvil cuando el menú está abierto */}
        <div className={`${open ? "hidden" : "flex"} md:flex ml-auto items-center gap-2 z-[100]`}>
          {session.logged ? (
            <>
              {session.role === "admin" && (
                <Link href="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber/50 text-amber text-sm font-semibold hover:bg-amber hover:text-coal transition-colors">
                  Admin
                </Link>
              )}
              {session.artistSlug ? (
                <Link href={`/${session.artistSlug}/editar`} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-inkline text-sm font-semibold text-bone hover:st-border hover:st-text transition-colors">
                  Mi estación
                </Link>
              ) : (
                <Link href="/crear" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-inkline text-sm font-semibold text-bone hover:st-border hover:st-text transition-colors">
                  Crear estación
                </Link>
              )}
              <button onClick={logout} className="font-tech text-[10px] tracking-[0.2em] uppercase text-bone-dim hover:text-signal transition-colors px-2">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block font-tech text-[11px] tracking-[0.18em] uppercase text-bone-dim hover:text-signal transition-colors px-2">
                Entrar
              </Link>
              <Link href="/crear" className="inline-flex items-center gap-2 px-4 py-2 bg-signal text-coal font-display font-bold text-sm hover:brightness-110 active:translate-y-0.5 transition-all hard-shadow">
                Crear mi estación <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
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
            <li><Link href="/playlists" className="text-bone hover:text-signal transition-colors">Playlists públicas</Link></li>
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
