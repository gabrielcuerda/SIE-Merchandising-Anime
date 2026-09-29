import type { ItemPedido, Pedido, Producto } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ESTADOS_NO_VENTA,
  pedidoStatusLabels,
  STOCK_BAJO,
} from "@/lib/admin/constants";

export type PedidoResumen = Pedido & {
  items_pedido: ItemPedido[];
  profiles?: { full_nombre: string | null } | null;
};

export type ProductoResumen = Producto & {
  producto_imagenes: { id: string; url: string; alt_text: string | null }[];
};

export type VentaMensual = {
  clave: string;
  etiqueta: string;
  total: number;
  pedidos: number;
};

export type TopProducto = {
  producto_id: string;
  titulo: string;
  unidades: number;
  ingresos: number;
};

export type DashboardMetrics = {
  ventas30d: number;
  pedidos30d: number;
  ticketMedio: number;
  /** `null` cuando el periodo anterior no tenía ventas (sin base de cálculo). */
  variacionVentas: number | null;
  variacionPedidos: number | null;
  totalProductos: number;
  productosActivos: number;
  totalUsuarios: number;
  pedidosPendientes: number;
  serieMensual: VentaMensual[];
  topProductos: TopProducto[];
  stockBajo: ProductoResumen[];
  ultimosPedidos: PedidoResumen[];
  pedidosPorEstado: { status: Pedido["status"]; total: number }[];
  moneda: string;
};

const DIAS_MES = 30;

/**
 * Métricas del dashboard.
 *
 * Estrategia: el volumen de un ecommerce de proyecto es pequeño, así que se
 * traen los pedidos con sus items y se agrega en memoria (mismo criterio que
 * `getProductosMasVendidos` en `lib/db/productos.ts`). Los índices de
 * `supabase/sql/001_admin_rls.sql` evitan el seq scan sobre `pedidos`.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createAdminClient();

  const ahora = new Date();
  const desde30 = new Date(ahora.getTime() - DIAS_MES * 24 * 60 * 60 * 1000);
  const desde60 = new Date(ahora.getTime() - 2 * DIAS_MES * 24 * 60 * 60 * 1000);
  const desde12Meses = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 11, 1),
  );

  const [
    pedidosRes,
    stockRes,
    productosTotalRes,
    productosActivosRes,
    usuariosRes,
    ultimoRes,
    backlogRes,
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, items_pedido(*)")
      .gte("created_at", desde12Meses.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("productos")
      .select("*, producto_imagenes(id, url, alt_text)")
      .lte("stock", STOCK_BAJO)
      .order("stock", { ascending: true })
      .limit(10),
    supabase.from("productos").select("id", { count: "exact", head: true }),
    supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .neq("status", "a-pedido"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("pedidos")
      .select("*, items_pedido(*)")
      .order("created_at", { ascending: false })
      .limit(8),
    // El backlog se cuenta sobre TODOS los pedidos, no sobre los últimos 12
    // meses: un pedido pagado hace meses sigue sin enviarse y el equipo
    // necesita verlo hasta que se cierre.
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "paid"]),
  ]);

  for (const [nombre, res] of Object.entries({
    pedidos: pedidosRes,
    stockBajo: stockRes,
    productosTotal: productosTotalRes,
    productosActivos: productosActivosRes,
    usuarios: usuariosRes,
    ultimosPedidos: ultimoRes,
    backlog: backlogRes,
  })) {
    if (res.error) {
      throw new Error(`No hemos podido cargar las métricas (${nombre}).`);
    }
  }

  const pedidos = (pedidosRes.data ?? []) as PedidoResumen[];
  const ultimosPedidos = (ultimoRes.data ?? []) as PedidoResumen[];
  const stockBajo = (stockRes.data ?? []) as ProductoResumen[];
  const moneda = pedidos[0]?.moneda || "EUR";

  // --- KPIs de los últimos 30 días, comparados con los 30 anteriores -------
  const en30 = pedidos.filter((p) => new Date(p.created_at) >= desde30);
  const en60Anterior = pedidos.filter((p) => {
    const fecha = new Date(p.created_at);
    return fecha >= desde60 && fecha < desde30;
  });

  const ventas30d = sumarVentas(en30);
  const ventasAnteriores = sumarVentas(en60Anterior);

  const pedidos30d = en30.length;
  const pedidosAnteriores = en60Anterior.length;
  const ticketMedio = pedidos30d > 0 ? ventas30d / pedidos30d : 0;

  // --- Serie de ventas por mes (12 meses) ---------------------------------
  const serieMensual = construirSerieMensual(pedidos, ahora);

  // --- Top productos por unidades (12 meses) ------------------------------
  const topProductos = construirTopProductos(pedidos, 5);

  // --- Pedidos por estado (12 meses) --------------------------------------
  const conteoPorEstado = new Map<Pedido["status"], number>();
  for (const pedido of pedidos) {
    conteoPorEstado.set(
      pedido.status,
      (conteoPorEstado.get(pedido.status) ?? 0) + 1,
    );
  }
  const pedidosPorEstado = (Object.keys(pedidoStatusLabels) as Pedido["status"][])
    .map((status) => ({ status, total: conteoPorEstado.get(status) ?? 0 }))
    .filter((entry) => entry.total > 0);

  return {
    ventas30d,
    pedidos30d,
    ticketMedio,
    variacionVentas: variacion(ventas30d, ventasAnteriores),
    variacionPedidos: variacion(pedidos30d, pedidosAnteriores),
    totalProductos: productosTotalRes.count ?? 0,
    productosActivos: productosActivosRes.count ?? 0,
    totalUsuarios: usuariosRes.count ?? 0,
    pedidosPendientes: backlogRes.count ?? 0,
    serieMensual,
    topProductos,
    stockBajo,
    ultimosPedidos,
    pedidosPorEstado,
    moneda,
  };
}

function sumarVentas(pedidos: Pedido[]) {
  return pedidos
    .filter((pedido) => !ESTADOS_NO_VENTA.includes(pedido.status))
    .reduce((total, pedido) => total + Number(pedido.total ?? 0), 0);
}

/** Variación porcentual contra el periodo anterior. `null` si no hay base. */
function variacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / anterior) * 100;
}

/**
 * Los 12 últimos meses naturales, incluidos los que aún no tienen ventas, para
 * que el gráfico no "salte" meses en blanco.
 */
function construirSerieMensual(
  pedidos: Pedido[],
  ahora: Date,
): VentaMensual[] {
  const meses = new Map<string, VentaMensual>();

  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(
      Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - i, 1),
    );
    const clave = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;

    meses.set(clave, {
      clave,
      etiqueta: new Intl.DateTimeFormat("es-ES", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }).format(fecha),
      total: 0,
      pedidos: 0,
    });
  }

  for (const pedido of pedidos) {
    if (ESTADOS_NO_VENTA.includes(pedido.status)) continue;

    const fecha = new Date(pedido.created_at);
    const clave = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
    const mes = meses.get(clave);

    if (!mes) continue;
    mes.total += Number(pedido.total ?? 0);
    mes.pedidos += 1;
  }

  return [...meses.values()];
}

function construirTopProductos(
  pedidos: PedidoResumen[],
  limite: number,
): TopProducto[] {
  const porProducto = new Map<string, TopProducto>();

  for (const pedido of pedidos) {
    if (ESTADOS_NO_VENTA.includes(pedido.status)) continue;

    for (const item of pedido.items_pedido ?? []) {
      if (!item.producto_id) continue;

      const actual = porProducto.get(item.producto_id) ?? {
        producto_id: item.producto_id,
        titulo: item.titulo_producto,
        unidades: 0,
        ingresos: 0,
      };

      actual.unidades += item.cantidad ?? 0;
      actual.ingresos += (item.cantidad ?? 0) * Number(item.precio ?? 0);
      porProducto.set(item.producto_id, actual);
    }
  }

  return [...porProducto.values()]
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, limite);
}
