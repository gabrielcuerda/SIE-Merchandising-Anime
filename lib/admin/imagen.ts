/**
 * Normalización de slugs para `productos.slug` y `categorias.slug`.
 *
 * El mismo criterio que usa el catálogo: minúsculas, sin diacríticos y con
 * guiones como separador. Se ejecuta en el cliente para sugerir el valor y en
 * el servidor para calcular el definitivo; la unicidad la garantiza la RPC, no
 * esta función.
 *
 * Ejemplo: "Goku & Gohan Beast Vjump Exclusive" -> "goku-gohan-beast-vjump-exclusive"
 */

// NFKD separa la tilde de la letra; este rango las elimina. Se construye con
// `new RegExp` a propósito: así el fichero guarda los escapes ASCII en lugar de
// los caracteres combinantes en sí, que son invisibles y se corrompen con
// facilidad al copiar, pegar o formatear.
const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");
const NO_ALFANUMERICO = /[^a-z0-9]+/g;

export function slugify(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(DIACRITICOS, "")
    .toLowerCase()
    .replace(NO_ALFANUMERICO, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Convierte el campo de etiquetas del formulario (texto separado por comas) en
 * el `text[]` que espera `productos.tags`.
 *
 * Devuelve `null` cuando no hay ninguna, no un array vacío: es lo que espera la
 * RPC y lo que distingue "sin etiquetas" de "lista vacía".
 */
export function parseTags(entrada: string | null | undefined): string[] | null {
  const tags = (entrada ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  return tags.length > 0 ? Array.from(new Set(tags)) : null;
}

const MIME_A_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/** Lista blanca de formatos. Debe coincidir con `allowed_mime_types` del bucket. */
export const MIME_PERMITIDOS = Object.keys(MIME_A_EXTENSION);

/** Tope de tamaño por archivo: coincide con `file_size_limit` del bucket. */
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export function extensionDesdeMime(mime: string | null | undefined) {
  return MIME_A_EXTENSION[mime ?? ""] ?? "bin";
}

/**
 * Path del objeto en Storage, generado en el servidor.
 *
 * NUNCA uses el `File.name` que envía el cliente: puede traer `../`, barras,
 * null bytes o una extensión que no corresponde con el contenido. La extensión
 * sale del MIME validado, que es el dato en el que sí se puede confiar (y que el
 * bucket vuelve a comprobar por su cuenta con `allowed_mime_types`).
 */
export function rutaObjetoImagen(
  productoId: string,
  mime: string,
  random: string,
): string {
  return `productos/${productoId}/${Date.now()}-${random}.${extensionDesdeMime(mime)}`;
}

/**
 * Valida un archivo en el servidor.
 *
 * El cliente también valida, pero solo para dar feedback rápido. Esta es la
 * comprobación que cuenta. El bucket aplica una tercera capa con
 * `file_size_limit` y `allowed_mime_types`.
 */
export function validarArchivo(
  file: File,
): { ok: true; extension: string } | { ok: false; error: string } {
  if (!MIME_PERMITIDOS.includes(file.type)) {
    return {
      ok: false,
      error: "Formato no admitido. Usa PNG, JPEG, WebP, AVIF o GIF.",
    };
  }

  if (file.size === 0) {
    return { ok: false, error: "El archivo está vacío." };
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      error: `La imagen pesa ${mb} MB y el máximo son 5 MB.`,
    };
  }

  return { ok: true, extension: extensionDesdeMime(file.type) };
}

/**
 * URL pública de un objeto del bucket. El host coincide con el
 * `remotePatterns` que ya tiene `next.config.ts`, así que `next/image` lo
 * optimiza sin tocar la configuración de Next.
 */
export function urlPublicaImagen(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  if (!base) return "";
  return `${base}/storage/v1/object/public/productos/${path}`;
}

/** Invierte `urlPublicaImagen`: extrae la ruta del objeto desde la URL guardada. */
export function pathDesdeUrl(url: string): string | null {
  return (
    url.match(/\/storage\/v1\/object\/public\/productos\/(.+)$/)?.[1] ?? null
  );
}

/** Token aleatorio para el nombre del objeto, sin depender de `File.name`. */
export function tokenAleatorio() {
  return crypto.randomUUID().slice(0, 8);
}
