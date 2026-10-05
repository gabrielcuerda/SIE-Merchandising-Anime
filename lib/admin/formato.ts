import { siteConfig } from "@/lib/site";

/**
 * Formateo para el panel. El sitio es español primero: `siteConfig.locale` es
 * `es_ES` y la moneda es EUR, así que no hay nada que adivinar.
 */

const euros = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  minimumFractionDigits: 2,
});

const eurosSinDecimales = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 0,
});

const entero = new Intl.NumberFormat(siteConfig.locale);

const fechaCorta = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const fechaHora = new Intl.DateTimeFormat(siteConfig.locale, {
  dateStyle: "medium",
  timeStyle: "short",
});

const fechaLarga = new Intl.DateTimeFormat(siteConfig.locale, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** `productos.precio` se guarda SIN IVA: el 21 % se aplica en el checkout. */
export function precioSinIVA(valor: number | string | null | undefined) {
  return euros.format(Number(valor ?? 0));
}

export function importe(valor: number | string | null | undefined) {
  return euros.format(Number(valor ?? 0));
}

/** Para cifras grandes del dashboard, donde los decimales solo estorban. */
export function importeRedondeado(valor: number | string | null | undefined) {
  return eurosSinDecimales.format(Number(valor ?? 0));
}

export function numero(valor: number | string | null | undefined) {
  return entero.format(Number(valor ?? 0));
}

export function fecha(valor: string | null | undefined) {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : fechaCorta.format(d);
}

export function fechaYhora(valor: string | null | undefined) {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : fechaHora.format(d);
}

export function fechaEnEspañol(valor: string | Date) {
  const d = typeof valor === "string" ? new Date(valor) : valor;
  return Number.isNaN(d.getTime()) ? "—" : fechaLarga.format(d);
}

/** Fecha ISO de hoy, para el `updated_at` que rellenan las RPC. */
export function ahora() {
  return new Date().toISOString();
}

/**
 * Enmascara un email para el listado.
 *
 * Los emails son dato personal: el panel los enseña tapados por defecto y hace
 * falta una acción explícita para revelarlos.
 */
export function enmascararEmail(email: string | null | undefined) {
  if (!email) return "—";

  const [usuario, dominio] = email.split("@");
  if (!dominio) return email;

  const visible = usuario?.slice(0, 1) ?? "";
  return `${visible}${"•".repeat(Math.min(usuario?.length ?? 1, 8))}@${dominio}`;
}

/** Iniciales para el avatar de usuario. */
export function iniciales(
  nombre: string | null | undefined,
  email?: string | null,
) {
  const fuente = nombre?.trim() || email?.split("@")[0] || "?";
  const partes = fuente.split(/[\s._-]+/).filter(Boolean);
  const a = partes[0]?.[0] ?? "?";
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

/** Identificador de pedido corto para la tabla del listado. */
export function idCorto(id: string) {
  return id.slice(0, 8).toUpperCase();
}
