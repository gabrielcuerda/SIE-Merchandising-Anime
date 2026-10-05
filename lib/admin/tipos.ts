import type { Producto } from "@/lib/db/types";

/**
 * Tipos de retorno de las RPC `admin_*` y del cliente de administración.
 *
 * No existe un tipo `Database` generado por la CLI de Supabase en este
 * proyecto (las tablas se crearon a mano y nunca se versionaron), así que estos
 * tipos son el contrato explícito con la migración
 * `supabase/migrations/20261004000000_admin_p5.sql`. Si cambias una firma allí,
 * cámbiala aquí.
 */

export type AdminActionState = {
  success?: string;
  error?: string;
};

/** `productos.status` — solo `stock` descuenta inventario. */
export const PRODUCTO_STATUS = [
  "stock",
  "pre-venta",
  "a-pedido",
  "oferta",
] as const satisfies readonly Producto["status"][];

export const PRODUCTO_STATUS_LABEL: Record<Producto["status"], string> = {
  stock: "En stock",
  "pre-venta": "Próximamente",
  "a-pedido": "Bajo pedido",
  oferta: "Oferta",
};

/** Umbral que considera "stock bajo" en el dashboard. */
export const STOCK_BAJO = 5;

/** `pedidos.status` */
export const PEDIDO_STATUS = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type PedidoStatus = (typeof PEDIDO_STATUS)[number];

export const PEDIDO_STATUS_LABEL: Record<PedidoStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

/** Estados que cuentan como dinero cobrado. `admin_metricas` usa la misma lista. */
export const PEDIDO_STATUS_PAGADOS: PedidoStatus[] = [
  "paid",
  "shipped",
  "delivered",
];

export type PedidoStatusTone =
  | "neutral"
  | "info"
  | "brand"
  | "success"
  | "alert";

export const PEDIDO_STATUS_TONE: Record<PedidoStatus, PedidoStatusTone> = {
  pending: "neutral",
  paid: "success",
  shipped: "info",
  delivered: "brand",
  cancelled: "alert",
};

/**
 * Recorrido normal de un pedido, para la barra de progreso del detalle.
 *
 * Vive aquí y no en `lib/admin/pedidos.ts` porque lo consumen Client Components
 * y ese módulo importa el cliente de Supabase de servidor (`next/headers`), que
 * no puede acabar en el grafo del cliente.
 *
 * `cancelled` no aparece: es una salida del circuito, no un eslabón.
 */
export const SECUENCIA_PEDIDO: PedidoStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
];

export function pasoEnSecuencia(status: PedidoStatus) {
  return SECUENCIA_PEDIDO.indexOf(status);
}

/** Forma de `admin_metricas()`. */
export type AdminMetricas = {
  productos: {
    total: number;
    stock_bajo: number;
    destacados: number;
    sin_imagen: number;
    sin_categoria: number;
  };
  categorias: { total: number; sin_productos: number };
  pedidos: {
    total: number;
    por_estado: Record<string, number>;
    facturacion_30d: number;
    facturacion_total: number;
    ultimos: {
      id: string;
      status: string;
      total: number;
      created_at: string;
    }[];
  };
  usuarios: { total: number };
};

/** Fila de `admin_lista_usuarios()`. */
export type AdminUsuario = {
  id: string;
  email: string | null;
  nombre: string | null;
  telefono: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  es_admin: boolean;
  bloqueado: boolean;
  pedidos: number;
  total_gastado: number;
};

/** Fila de `admin_usuario_detalle()`. */
export type AdminUsuarioDetalle = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  es_admin: boolean;
  bloqueado: boolean;
  perfil: {
    full_nombre: string | null;
    telefono: string | null;
    direccion_calle: string | null;
    direccion_ciudad: string | null;
    direccion_provincia: string | null;
    direccion_codigo_postal: string | null;
    direccion_pais: string | null;
  } | null;
  pedidos: {
    id: string;
    status: string;
    total: number;
    created_at: string;
    articulos: number;
  }[];
};

/** Desglose que `crear_pedido` guarda dentro del jsonb `direccion_pago`. */
export type DireccionPago = {
  subtotal: number;
  iva_porcentaje: number;
  iva: number;
  coste_envio: number;
  total: number;
} | null;

/** Lo que `direccionAMetadata` de `lib/checkout.ts` termina guardando en el pedido. */
export type DireccionPedido = {
  nombre?: string;
  calle?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  email?: string;
  telefono?: string;
} | null;

/** Variante tal y como la devuelve el detalle de producto. */
export type ProductoVarianteAdmin = {
  id: string;
  producto_id: string;
  titulo: string;
  sku: string | null;
  precio: number;
  stock: number;
  opciones: { name: string; value: string }[];
};

/** Producto con sus relaciones, tal y como lo devuelve el listado del panel. */
export type ProductoAdmin = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  categoria_id: string | null;
  status: Producto["status"];
  stock: number;
  destacado: boolean;
  tags: string[] | null;
  sku: string | null;
  created_at: string;
  updated_at: string;
  producto_imagenes: {
    id: string;
    url: string;
    alt_text: string | null;
    orden_cat: number;
  }[];
  producto_variantes: ProductoVarianteAdmin[];
  categorias: { nombre: string; slug: string } | null;
};

/** Categoría con el número de productos, para el árbol del panel. */
export type CategoriaAdmin = {
  id: string;
  nombre: string;
  slug: string;
  parent_id: string | null;
  descripcion: string | null;
  image_url: string | null;
  orden_cat: number;
  created_at: string;
  total_productos: number;
};

/**
 * Nodo del árbol de categorías.
 *
 * Se declara aquí, y no junto a `construirArbol()` en `lib/admin/categorias.ts`,
 * porque la consumen Client Components y ese módulo importa el cliente de
 * Supabase de servidor, que no puede acabar en el grafo del cliente.
 */
export type NodoCategoria = CategoriaAdmin & { hijas: NodoCategoria[] };

/** Pedido del listado, con el cliente resuelto. */
export type PedidoAdmin = {
  id: string;
  usuario_id: string | null;
  status: PedidoStatus;
  subtotal: number;
  coste_envio: number;
  total: number;
  moneda: string;
  direccion_pedido: DireccionPedido;
  direccion_pago: DireccionPago;
  metodo_pago: string | null;
  pago_id: string | null;
  tracking_numero: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  perfiles: { full_nombre: string | null } | null;
  items_pedido: {
    id: string;
    producto_id: string | null;
    titulo_producto: string;
    img_producto: string | null;
    cantidad: number;
    precio: number;
  }[];
};
