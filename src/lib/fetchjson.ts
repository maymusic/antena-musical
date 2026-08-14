/**
 * Lectura segura de respuestas del servidor.
 *
 * Evita el fallo del navegador:
 *   "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 *
 * Ese error ocurre cuando la respuesta llega vacía (por ejemplo si la ruta
 * del servidor revienta y corta la conexión) o cuando devuelve HTML en vez
 * de JSON. Aquí lo convertimos en un mensaje entendible.
 */
export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResult<T>> {
  let res: Response;

  try {
    res = await fetch(input, init);
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      error: "No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez.",
    };
  }

  const raw = await res.text().catch(() => "");

  if (!raw.trim()) {
    return {
      ok: false,
      status: res.status,
      data: null,
      error:
        res.status === 0 || res.status >= 500
          ? "El servidor no respondió. Si acabas de desplegar, aplica la migración de la base de datos."
          : "El servidor devolvió una respuesta vacía.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: "El servidor devolvió una respuesta inesperada.",
    };
  }

  const data = parsed as T & { error?: string };

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      data,
      error: data?.error || `Error ${res.status}.`,
    };
  }

  return { ok: true, status: res.status, data, error: null };
}
