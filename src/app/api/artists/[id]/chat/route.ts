import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, messages } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Rate limit simple por IP (en memoria; suficiente para la demo). */
const lastPost = new Map<string, number>();
const COOLDOWN_MS = 4000;

const BAD_WORDS = ["puta", "mierda", "pendejo", "imbecil", "idiota", "culo", "maricon", "cabron"];

function clean(text: string): string {
  let out = text;
  for (const w of BAD_WORDS) {
    out = out.replace(new RegExp(w, "gi"), "•".repeat(w.length));
  }
  return out;
}

type Ctx = { params: Promise<{ id: string }> };

/** GET = últimos mensajes del chat de la estación. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });

  const rows = await db
    .select({
      id: messages.id,
      nick: messages.nick,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.artistId, artistId))
    .orderBy(desc(messages.id))
    .limit(60);

  return Response.json({ messages: rows.reverse() });
}

/** POST = enviar un mensaje (público, con límite por IP). */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const artistId = parseInt(id, 10);
  if (!Number.isFinite(artistId)) return Response.json({ error: "ID inválido." }, { status: 400 });

  // el artista debe existir
  const artist = await db.select({ id: artists.id }).from(artists).where(eq(artists.id, artistId)).limit(1);
  if (artist.length === 0) return Response.json({ error: "Estación no encontrada." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const nick = clean(String(body.nick ?? "").trim()).slice(0, 24);
  const text = clean(String(body.body ?? "").trim()).slice(0, 300);

  if (nick.length < 2) return Response.json({ error: "Pon tu nombre (mínimo 2 letras)." }, { status: 400 });
  if (text.length < 1) return Response.json({ error: "Escribe algo antes de enviar." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}:${artistId}`;
  const prev = lastPost.get(key) ?? 0;
  const now = Date.now();
  if (now - prev < COOLDOWN_MS) {
    return Response.json({ error: `La señal viaja despacio: espera ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)}s.` }, { status: 429 });
  }
  lastPost.set(key, now);

  const [message] = await db
    .insert(messages)
    .values({ artistId, nick, body: text })
    .returning();

  return Response.json({ message }, { status: 201 });
}
