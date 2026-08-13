import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Instrument_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://antenamusical.com"),
};

export const viewport: Viewport = {
  themeColor: "#16120e",
};

import { SessionProvider } from "@/components/SessionProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${tech.variable}`}>
      <body className="bg-coal text-bone antialiased font-body">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
