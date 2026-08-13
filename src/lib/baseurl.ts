/**
 * Dominio público real de la instalación.
 *
 * Importante para compartir: las tarjetas de WhatsApp/Facebook/X necesitan URLs
 * absolutas que existan de verdad. Si aún no hay dominio propio conectado,
 * usamos el que Vercel asigna automáticamente.
 */
export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  const deploy = process.env.VERCEL_URL?.trim();
  if (deploy) return `https://${deploy.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
