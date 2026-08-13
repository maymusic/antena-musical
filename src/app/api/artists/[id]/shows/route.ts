import { db } from "@/db";
import { shows } from "@/db/schema";
import { authorizedArtist, json } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return json({ error: "ID inválido." }, 400);

  const body = await req.json().catch(() => ({}));
  const owner = await authorizedArtist(artistId, String(body.token ?? ""), req.headers.get("cookie"));
  if (!owner) return json({ error: "Código incorrecto." }, 403);

  const dateStr = String(body.date ?? "");
  const showDate = new Date(dateStr.length === 10 ? `${dateStr}T20:00:00` : dateStr);
  if (Number.isNaN(showDate.getTime())) return json({ error: "Fecha inválida." }, 400);

  const venue = String(body.venue ?? "").trim().slice(0, 120);
  if (!venue) return json({ error: "Indica el recinto o evento." }, 400);
  const city = String(body.city ?? "").trim().slice(0, 80);

  const [show] = await db
    .insert(shows)
    .values({ artistId, showDate, venue, city })
    .returning();

  return json({ show }, 201);
}
