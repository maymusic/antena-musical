import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, messages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const artistId = Number(new URL(req.url).searchParams.get("artistId") ?? "");
  const query = db
    .select({ id: messages.id, nick: messages.nick, body: messages.body, createdAt: messages.createdAt, artistId: messages.artistId, artistName: artists.name, artistSlug: artists.slug })
    .from(messages)
    .innerJoin(artists, eq(messages.artistId, artists.id))
    .orderBy(desc(messages.createdAt))
    .limit(100);
  const rows = Number.isFinite(artistId) ? await query.where(eq(messages.artistId, artistId)) : await query;
  return Response.json({ messages: rows });
}
