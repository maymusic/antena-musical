import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, images, shows, tracks } from "@/db/schema";
import { TopBar, Footer } from "@/components/Chrome";
import ManagerPanel from "@/components/ManagerPanel";
import { IconAntenna } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel de control — ANTENA MUSICAL",
};

type Ctx = { params: Promise<{ slug: string }> };

export default async function EditarPage({ params }: Ctx) {
  const { slug } = await params;
  const rows = await db.select().from(artists).where(eq(artists.slug, slug)).limit(1);
  const artist = rows[0];
  if (!artist) notFound();

  const [artistTracks, artistImages, artistShows] = await Promise.all([
    db.select().from(tracks).where(eq(tracks.artistId, artist.id)).orderBy(asc(tracks.position), asc(tracks.id)),
    db.select().from(images).where(eq(images.artistId, artist.id)).orderBy(asc(images.position), asc(images.id)),
    db.select().from(shows).where(eq(shows.artistId, artist.id)).orderBy(asc(shows.showDate)),
  ]);

  return (
    <div className="min-h-screen" style={{ ["--st" as string]: artist.accent }}>
      <TopBar solid />
      <main className="mx-auto max-w-5xl px-4 pt-12 pb-8">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 st-bg text-coal">
              <IconAntenna className="w-5 h-5" />
            </span>
            <div>
              <p className="font-tech text-[10px] tracking-[0.3em] uppercase text-bone-dim">Panel de control</p>
              <h1 className="font-display font-extrabold text-2xl leading-tight">{artist.name}</h1>
            </div>
          </div>
          <span className="ml-auto font-tech text-[10px] tracking-widest uppercase text-bone-dim">
            estación: <Link href={`/${artist.slug}`} className="st-text hover:underline">/{artist.slug}</Link>
          </span>
        </div>
        <ManagerPanel
          initial={{ artist, tracks: artistTracks, images: artistImages, shows: artistShows }}
        />
      </main>
      <Footer />
    </div>
  );
}
