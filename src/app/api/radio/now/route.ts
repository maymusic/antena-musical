import { getNowPlaying } from "@/lib/radio";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = await getNowPlaying();
  return Response.json(now, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
