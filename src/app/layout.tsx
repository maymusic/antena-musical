import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Instrument_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { getBaseUrl } from "@/lib/baseurl";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const tech = Space_Mono({
  subsets: ["latin"],
  variable: "--font-tech",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Antena Musical — Tu propia estación de radio online",
  description:
    "Antena Musical: crea tu espacio de artista con biografía, galería, videos y tus canciones sonando como una radio online en tiempo real.",
  metadataBase: new URL(getBaseUrl()),
  manifest: "/manifest.json",
  openGraph: {
    title: "Antena Musical — Tu propia estación de radio online",
    description: "Cada artista, su propia radio 24/7. Biografía, galería, videos y su música sonando en cadena.",
    type: "website",
    siteName: "Antena Musical",
    locale: "es_ES",
    images: [{ url: "/api/og/antena", width: 1200, height: 630, alt: "Antena Musical" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Antena Musical — Tu propia estación de radio online",
    description: "Cada artista, su propia radio 24/7.",
    images: ["/api/og/antena"],
  },
};

export const viewport: Viewport = {
  themeColor: "#16120e",
};

import { SessionProvider } from "@/components/SessionProvider";
import { GlobalPlayerProvider } from "@/components/GlobalPlayer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${tech.variable}`}>
      <body className="bg-coal text-bone antialiased font-body">
        <SessionProvider>
          <GlobalPlayerProvider>{children}</GlobalPlayerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
