import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<{ sent: boolean }> {
  if (!smtpConfigured()) {
    console.info(`[ANTENA MUSICAL] SMTP no configurado. Enlace de recuperación para ${to}: ${resetUrl}`);
    return { sent: false };
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Recupera el acceso a tu cabina — ANTENA MUSICAL",
    text: `Recibimos una solicitud para restablecer la contraseña de tu cuenta ANTENA MUSICAL. Abre este enlace (válido por 60 minutos): ${resetUrl}\n\nSi no lo solicitaste, ignora este correo.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#16120e;color:#f2e9da;padding:32px"><p style="color:#ff4d00;letter-spacing:2px;font-size:12px">ANTENA MUSICAL · RECUPERACIÓN DE CUENTA</p><h1 style="margin:0 0 16px">Vuelve a tu cabina.</h1><p>Recibimos una solicitud para cambiar tu contraseña. Este enlace caduca en <strong>60 minutos</strong>.</p><p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;background:#ff4d00;color:#16120e;padding:14px 20px;text-decoration:none;font-weight:bold">Restablecer contraseña</a></p><p style="font-size:12px;color:#b8ab97">Si no solicitaste este cambio, puedes ignorar este correo.</p></div>`,
  });

  return { sent: true };
}

export function isSmtpConfigured() {
  return smtpConfigured();
}
