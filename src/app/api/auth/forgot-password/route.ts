import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/crypto";
import { isValidEmail } from "@/lib/auth";
import { sendPasswordResetEmail, isSmtpConfigured } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/** POST = pide recuperación. La respuesta siempre es neutral para no revelar cuentas. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const generic = { ok: true, message: "Si existe una cuenta con ese email, recibirás instrucciones para recuperar tu acceso." };
  if (!isValidEmail(email)) return Response.json(generic);

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) return Response.json(generic);

  // invalida tokens vigentes de esa cuenta antes de crear uno nuevo
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())));

  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

  const origin = new URL(req.url).origin;
  const resetUrl = `${origin}/resetear-contrasena?token=${encodeURIComponent(token)}`;
  const mail = await sendPasswordResetEmail({ to: user.email, resetUrl });

  // En desarrollo sin SMTP se incluye una ayuda explícita. En producción nunca se expone el token.
  const devUrl = process.env.NODE_ENV !== "production" && !mail.sent ? resetUrl : undefined;
  return Response.json({ ...generic, smtpConfigured: isSmtpConfigured(), developmentResetUrl: devUrl });
}
