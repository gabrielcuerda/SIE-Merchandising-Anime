export type CarritoItem = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  producto_id: string;
  variante_id: string;
  cantidad: number;
  created_at: string;
  // Joins
  productos?: {
    titulo: string;
    slug: string;
    producto_imagenes: { url: string; alt_text: string }[];
  };
  producto_variantes?: {
    titulo: string;
    precio: number;
  };
};

export type Carrito = {
  items: CarritoItem[];
  totalItems: number;
  /** Suma de precios sin IVA. */
  subtotal: number;
  /** IVA aplicado sobre el subtotal. */
  iva: number;
  costeEnvio: number;
  /** Lo que se cobra de verdad: subtotal + iva + costeEnvio. */
  total: number;
  moneda: string;
};

export type Pedido = {
  id: string;
  usuario_id: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  coste_envio: number;
  total: number;
  moneda: string;
  direccion_pedido: {
    nombre: string;
    calle: string;
    ciudad: string;
    provincia: string;
    codigo_postal: string;
    pais: string;
    /**
     * A quién se manda la factura. Lo escribe `crear_pedido` a partir del
     * `direccion` que le pasa el webhook: el email de la sesión de Stripe o, en
     * su defecto, el que se pidió en `/checkout`. Los pedidos anteriores a esto
     * no lo tienen, y por eso no se les puede facturar por correo.
     */
    email?: string;
    telefono?: string;
  } | null;
  /** Desglose del cobro: subtotal sin IVA, IVA, envío y total. */
  direccion_pago: {
    subtotal: number;
    iva_porcentaje: number;
    iva: number;
    coste_envio: number;
    total: number;
  } | null;
  metodo_pago: string | null;
  pago_id: string | null;
  created_at: string;
  items_pedido: ItemPedido[];
};

export type ItemPedido = {
  id: string;
  pedido_id: string;
  producto_id: string;
  variante_id: string;
  titulo_producto: string;
  img_producto: string | null;
  cantidad: number;
  precio: number;
};
