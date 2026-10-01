export const BUCKET_PRODUCTOS = "productos";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_PERMITIDOS = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export const IMAGE_MIME_PERMITIDOS = [...MIME_PERMITIDOS.keys()];

/**
 * Normaliza un título a slug: sin acentos, sin signos, con guiones.
 * "Camiseta One Piece Vol. 1" → "camiseta-one-piece-vol-1"
 */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function extensionFor(mime: string): string | null {
  return MIME_PERMITIDOS.get(mime) ?? null;
}

/** Ruta dentro del bucket: una carpeta por producto, nombre aleatorio. */
export function buildObjectPath(
  productoId: string,
  extension: string,
): string {
  const sufijo =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${productoId}/${sufijo}.${extension}`;
}
