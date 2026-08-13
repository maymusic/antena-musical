/**
 * ANTENA MUSICAL no aloja imágenes: guarda únicamente enlaces públicos de Google Drive.
 * Convierte el enlace compartido en URL de miniatura de Drive, apta para <img>.
 */

export type DriveImage = { id: string; displayUrl: string; shareUrl: string };

export function normalizeGoogleDriveImage(raw: string): DriveImage | null {
  const value = raw.trim();
  if (!value || value.length > 1200) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (host !== "drive.google.com" && host !== "docs.google.com") return null;

  const fileMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const queryId = url.searchParams.get("id");
  const ucMatch = url.pathname.match(/\/(?:uc|open|thumbnail)/);
  const id = fileMatch?.[1] ?? (ucMatch ? queryId : null);

  if (!id || !/^[a-zA-Z0-9_-]{10,}$/.test(id)) return null;

  return {
    id,
    displayUrl: `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`,
    shareUrl: `https://drive.google.com/file/d/${encodeURIComponent(id)}/view?usp=sharing`,
  };
}

export function isGoogleDriveImageUrl(value: string): boolean {
  return /^(https:\/\/drive\.google\.com\/(?:thumbnail|uc)|https:\/\/docs\.google\.com\/)/i.test(value);
}
