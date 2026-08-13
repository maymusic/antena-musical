import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, shows } from "@/db/schema";

export const dynamic = "force-dynamic";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** GET = descarga un evento .ics para el calendario. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const showId = parseInt(id, 10);
  if (!Number.isFinite(showId)) return new Response("Not found", { status: 404 });

  const rows = await db
    .select({
      id: shows.id,
      showDate: shows.showDate,
      venue: shows.venue,
      city: shows.city,
      artistName: artists.name,
      artistSlug: artists.slug,
    })
    .from(shows)
    .innerJoin(artists, eq(shows.artistId, artists.id))
    .where(eq(shows.id, showId))
    .limit(1);

  const show = rows[0];
  if (!show) return new Response("Not found", { status: 404 });

  const start = new Date(show.showDate);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const summary = `${show.artistName} en vivo — ${show.venue}`;
  const location = [show.venue, show.city].filter(Boolean).join(", ");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ANTENA MUSICAL//Radios de artista//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:antenamusical-show-${show.id}@antenamusical.com`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${summary.replace(/[,;]/g, "\\$&")}`,
    `LOCATION:${location.replace(/[,;]/g, "\\$&")}`,
    `DESCRIPTION:Concierto anunciado en la estación ANTENA MUSICAL de ${show.artistName.replace(/[,;]/g, "\\$&")}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Mañana toca ${show.artistName.replace(/[,;]/g, "\\$&")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="antena-${show.artistSlug}-${show.id}.ics"`,
    },
  });
}
