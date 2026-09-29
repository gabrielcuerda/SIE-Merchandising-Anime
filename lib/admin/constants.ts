import type { Pedido, Producto } from "@/lib/db/types";

/**
 * Etiquetas y colores de estado, compartidos por el panel admin y por la
 * vista de pedidos del cliente para que el significado sea idéntico en
 * todas partes.
 */

export type PedidoStatus = Pedido["status"];
export type ProductoStatus = Producto["status"];

export const PEDIDO_STATUS_VALUES: PedidoStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

export const PRODUCTO_STATUS_VALUES: ProductoStatus[] = [
  "stock",
  "pre-venta",
  "a-pedido",
  "oferta",
];

type Tone = "neutral" | "warning" | "info" | "success" | "danger";

export const pedidoStatusLabels: Record<PedidoStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const pedidoStatusTones: Record<PedidoStatus, Tone> = {
  pending: "warning",
  paid: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export const productoStatusLabels: Record<ProductoStatus, string> = {
  stock: "En stock",
  "pre-venta": "Pre-venta",
  "a-pedido": "A pedido",
  oferta: "Oferta",
};

export const productoStatusTones: Record<ProductoStatus, Tone> = {
  stock: "success",
  "pre-venta": "info",
  "a-pedido": "warning",
  oferta: "danger",
};

/**
 * `cancelled` no es una venta. Se usa para el dashboard y para el ticket medio,
 * igual que ya hace `getProductosMasVendidos` en `lib/db/productos.ts`.
 */
export const ESTADOS_NO_VENTA: PedidoStatus[] = ["cancelled", "pending"];

export const currencyFormatter = (moneda = "EUR") =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: moneda || "EUR",
  });

export const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Umbral de stock bajo usado por el dashboard y el aviso del listado. */
export const STOCK_BAJO = 5;
