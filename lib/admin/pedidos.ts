import { requireAdmin } from "@/lib/admin/auth";
import {
  PEDIDO_STATUS,
  type PedidoAdmin,
  type PedidoStatus,
} from "@/lib/admin/tipos";

/**
 * Lecturas de pedidos para el panel.
 *
 * `items_pedido` se trae siempre con el pedido porque el detalle necesita los
 * SNAPSHOTS (`titulo_producto`, `img_producto`, `precio`): si reconsultara el
 * producto, un pedido antiguo dejaría de cuadrar en cuanto el producto cambiara de
 * precio o se borrara del catálogo. Es justo lo que el diseño del snapshot
 * evita.
 *
 * El panel NO gestiona pagos. Los pedidos los crea el webhook de Stripe
 * (`app/api/webhooks/stripe/route.ts`) y `pago_id` es la clave de idempotencia de
 * `crear_pedido`.
 */

export const PEDIDOS_POR_PAGINA = 20;

const CAMPOS =
  "id, usuario_id, status, subtotal, coste_envio, total, moneda, " +
  "direccion_pedido, direccion_pago, metodo_pago, pago_id, " +
  "tracking_numero, notas, created_at, updated_at, " +
  "perfiles(full_nombre), " +
  "items_pedido(id, producto_id, titulo_producto, img_producto, cantidad, precio)";

export type FiltroPedidos = {
  status?: string | null;
  desde?: string | null;
  hasta?: string | null;
  pagina?: number;
};

export type ListadoPedidos = {
  pedidos: PedidoAdmin[];
  total: number;
  pagina: number;
  paginas: number;
  porPagina: number;
};

export async function listarPedidos({
  status = null,
  desde = null,
  hasta = null,
  pagina = 1,
}: FiltroPedidos = {}): Promise<ListadoPedidos> {
  const { supabase } = await requireAdmin();

  const porPagina = PEDIDOS_POR_PAGINA;
  const desdeIndice = (Math.max(pagina, 1) - 1) * porPagina;

  let consulta = supabase
    .from("pedidos")
    .select(CAMPOS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(desdeIndice, desdeIndice + porPagina - 1);

  if (status && (PEDIDO_STATUS as readonly string[]).includes(status)) {
    consulta = consulta.eq("status", status);
  }

  if (desde) consulta = consulta.gte("created_at", desde);
  if (hasta) consulta = consulta.lte("created_at", `${hasta}T23:59:59.999Z`);

  const { data, error, count } = await consulta;

  if (error) {
    console.error("[admin] listarPedidos:", error.message);
    return { pedidos: [], total: 0, pagina: 1, paginas: 1, porPagina };
  }

  const total = count ?? 0;

  return {
    pedidos: (data ?? []) as unknown as PedidoAdmin[],
    total,
    pagina,
    paginas: Math.max(Math.ceil(total / porPagina), 1),
    porPagina,
  };
}

export async function obtenerPedido(id: string): Promise<PedidoAdmin | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("pedidos")
    .select(CAMPOS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] obtenerPedido:", error.message);
    return null;
  }

  return data as unknown as PedidoAdmin | null;
}

/**
 * Desglose económico del pedido.
 *
 * No hay columna de IVA en `pedidos`: el desglose vive dentro del jsonb
 * `direccion_pago`, que escribe `crear_pedido` con `{subtotal, iva_porcentaje,
 * iva, coste_envio, total}`. Si el jsonb no está (pedidos antiguos o pruebas
 * manuales) se reconstruye desde las columnas numéricas para no mostrar ceros.
 */
export function desglose(pedido: PedidoAdmin) {
  const guardado = pedido.direccion_pago;

  if (guardado && typeof guardado.total === "number") {
    return {
      subtotal: guardado.subtotal,
      ivaPorcentaje: guardado.iva_porcentaje,
      iva: guardado.iva,
      costeEnvio: guardado.coste_envio,
      total: guardado.total,
      estimado: false,
    };
  }

  return {
    subtotal: pedido.subtotal,
    ivaPorcentaje: null,
    iva: null,
    costeEnvio: pedido.coste_envio,
    total: pedido.total,
    estimado: true,
  };
}

/**
 * El desglose se calcula en `desglose()` (arriba). El recorrido de estados que
 * usa la barra de progreso del detalle vive en `@/lib/admin/tipos` porque lo
 * consumen Client Components y este módulo importa el cliente de Supabase de
 * servidor, que no puede acabar en el grafo del cliente.
 */
export { SECUENCIA_PEDIDO, pasoEnSecuencia } from "@/lib/admin/tipos";
