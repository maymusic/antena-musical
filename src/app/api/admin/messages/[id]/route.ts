import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Solo administración." }, { status: 403 });
  const { id } = await params;
  const messageId = Number(id);
  if (!Number.isFinite(messageId)) return Response.json({ error: "ID inválido." }, { status: 400 });
  await db.delete(messages).where(eq(messages.id, messageId));
  return Response.json({ ok: true });
}
