import { IVA_PORCENTAJE } from "@/lib/constants";
import { datosFiscales } from "@/lib/site";
import type { Pedido } from "@/lib/supabase/types";

/**
 * Vista única de una factura.
 *
 * El email (`plantilla-factura.ts`) y la página imprimible
 * (`app/factura/[pago_id]/page.tsx`) parten de las dos cosas de aquí. Si cada
 * uno calculara sus propios totales, el correo y la web dejarían de cuadrar en
 * cuanto cambiara el redondeo del IVA, y eso es exactamente el tipo de
 * discrepancia que hace que un cliente llame pidiendo explicaciones.
 */

export type LineaFactura = {
  titulo: string;
  imagen: string | null;
  cantidad: number;
  /** Precio unitario SIN IVA, el mismo que hay en `items_pedido.precio`. */
  precioUnitario: number;
  total: number;
};

export type ModeloFactura = {
  /** FAC-2026-A3F9C2E1. */
  numero: string;
  fecha: Date;
  pedidoId: string;
  /** Copia de los ocho primeros caracteres del id, sin prefijo: A3F9C2E1. */
  referencia: string;
  /** Nombre del destinatario; null si vino sin nombre legible. */
  cliente: string | null;
  email: string | null;
  direccion: DireccionOpcional | null;
  lineas: LineaFactura[];
  unidades: number;
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  costeEnvio: number;
  total: number;
  moneda: string;
  metodoPago: string | null;
  /** Enlace a la página imprimible de esta misma factura. */
  url: string;
};

/**
 * Importes en euros con el formato español (1.234,56 €).
 *
 * Se usa `Intl` en vez de `toFixed(2)` porque los correos HTML van a clientes
 * que leen cifras, y `total.toFixed(2)` produce `42.00` mientras que el formato
 * español produce `42,00 €`.
 */
export function formatearImporte(valor: number, moneda: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda || "EUR",
  }).format(Number(valor) || 0);
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
  }).format(fecha);
}

/**
 * Número de factura.
 *
 * Derivado del id del pedido y NO de un contador: el id es un uuid, así que
 * `FAC-{año}-{ocho caracteres}` es único sin tabla de secuencia ni bloqueos, y
 * es el mismo número que se ve en el panel, en /order-confirmation y en el
 * email. Una serie correlativa (FAC-2026-0001) es lo que se lleva en
 * contabilidad, pero exigiría serializar el alta; si algún día hace falta, es
 * una migración nueva, no un cambio de plantilla.
 */
export function numeroFactura(pedido: Pick<Pedido, "id" | "created_at">) {
  const anio = new Date(pedido.created_at).getFullYear();
  return `FAC-${anio}-${pedido.id.slice(0, 8).toUpperCase()}`;
}

/**
 * Lo mínimo que hace falta para facturar un pedido.
 *
 * Deliberadamente NO es `Pedido`: el panel lee los pedidos con
 * `PedidoAdmin` (`lib/admin/tipos.ts`), cuyo `direccion_pedido` tiene todos los
 * campos opcionales porque viene de un jsonb sin migrar. Tipar contra `Pedido`
 * obligaría a hacer una conversión falsa en `reenviarFactura` para poder
 * reutilizar este módulo, y ahí es donde se colarían los `undefined` que
 * romperían la plantilla. Este tipo admite ambas formas sin mentir.
 */
export type PedidoFacturable = {
  id: string;
  status: string;
  subtotal: number;
  coste_envio: number;
  total: number;
  moneda: string;
  metodo_pago: string | null;
  pago_id: string | null;
  created_at: string;
  /**
   * Campos opcionales a propósito, no por descuido. Es un jsonb: un pedido
   * insertado a mano o anterior a la migración puede no tener todos ellos, y la
   * plantilla ya trata cada parte como opcional (si no hay calle, no hay línea de
   * calle). Tiparlo como `Pedido["direccion_pedido"]` obligaría a mentir con un
   * `as` en el panel y a fingir que todos los pedidos traen dirección completa.
   */
  direccion_pedido: DireccionOpcional | null;
  direccion_pago: Pedido["direccion_pago"];
  /**
   * Solo los campos que la factura usa. El panel proyecta un subconjunto de
   * `items_pedido` en su consulta, así que tipar contra `ItemPedido` exigiría
   * `pedido_id` y `variante_id` que aquí no se piden; no se usan para facturar.
   */
  items_pedido: LineaFacturable[];
};

export type LineaFacturable = {
  titulo_producto: string;
  img_producto: string | null;
  cantidad: number;
  precio: number;
};

export type DireccionOpcional = {
  nombre?: string;
  calle?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  email?: string;
  telefono?: string;
};

export function construirModeloFactura(
  pedido: PedidoFacturable,
  sitioUrl: string,
): ModeloFactura {
  const desglose = pedido.direccion_pago;

  const subtotal = Number(desglose?.subtotal ?? pedido.subtotal);
  const ivaPorcentaje = Number(desglose?.iva_porcentaje ?? IVA_PORCENTAJE);
  const iva = Number(desglose?.iva ?? 0);
  const costeEnvio = Number(desglose?.coste_envio ?? pedido.coste_envio ?? 0);
  const total = Number(desglose?.total ?? pedido.total);

  const lineas: LineaFactura[] = pedido.items_pedido.map((item) => ({
    titulo: item.titulo_producto,
    imagen: item.img_producto ?? null,
    cantidad: item.cantidad,
    precioUnitario: Number(item.precio),
    total: Number(item.precio) * item.cantidad,
  }));

  const direccion = pedido.direccion_pedido ?? null;
  const email = direccion?.email?.trim() || null;

  return {
    numero: numeroFactura(pedido),
    fecha: new Date(pedido.created_at),
    pedidoId: pedido.id,
    referencia: pedido.id.slice(0, 8).toUpperCase(),
    cliente: direccion?.nombre?.trim() || null,
    email,
    direccion,
    lineas,
    unidades: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
    subtotal,
    ivaPorcentaje,
    iva,
    costeEnvio,
    total,
    moneda: pedido.moneda || "EUR",
    metodoPago: pedido.metodo_pago,
    url: `${sitioUrl}/factura/${encodeURIComponent(pedido.pago_id ?? pedido.id)}`,
  };
}
