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
  subtotal: number;
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
    telefono?: string;
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
