/**
 * Normaliza un enlace público de Google Drive para archivos descargables
 * (PDF, ZIP, carpeta de press kit). ANTENA MUSICAL no almacena el archivo:
 * solo guarda la referencia pública que comparte el artista.
 */

export type DriveFile = {
  kind: "file" | "folder";
  viewUrl: string;
  downloadUrl: string;
};

export function normalizeGoogleDriveFile(raw: string): DriveFile | null {
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

  // Carpeta compartida: se abre en Drive (permite descargar todo el kit)
  const folder = url.pathname.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]{10,})/);
  if (folder) {
    const viewUrl = `https://drive.google.com/drive/folders/${folder[1]}?usp=sharing`;
    return { kind: "folder", viewUrl, downloadUrl: viewUrl };
  }

  // Archivo suelto: PDF, ZIP, etc.
  const file = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  const queryId = url.searchParams.get("id");
  const id = file?.[1] ?? (/\/(?:uc|open)/.test(url.pathname) ? queryId : null);
  if (!id || !/^[a-zA-Z0-9_-]{10,}$/.test(id)) return null;

  return {
    kind: "file",
    viewUrl: `https://drive.google.com/file/d/${id}/view?usp=sharing`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
  };
}
