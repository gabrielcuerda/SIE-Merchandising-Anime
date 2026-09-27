export type Categoria = {
  id: string
  nombre: string
  slug: string
  parent_id: string | null
  descripcion: string | null
  image_url: string | null
  orden_cat: number
  created_at: string
}

export type Producto = {
  id: string
  titulo: string
  slug: string
  descripcion: string | null
  precio: number
  categoria_id: string | null
  status: 'stock' | 'pre-venta' | 'a-pedido' | 'oferta'
  stock: number
  destacado: boolean
  tags: string[] | null
  sku: string | null
  created_at: string
  updated_at: string
}

export type ProductoImagen = {
  id: string
  producto_id: string
  url: string
  alt_text: string | null
  orden_cat: number
}

export type ProductoVariante = {
  id: string
  producto_id: string
  titulo: string
  sku: string | null
  precio: number
  stock: number
  opciones: { name: string; value: string }[]
  created_at: string
}

export type CarritoItem = {
  id: string
  user_id: string
  session_id: string | null
  producto_id: string
  variante_id: string | null
  cantidad: number
  created_at: string
}

export type Profile = {
  id: string
  full_nombre: string | null
  telefono: string | null
  direccion_calle: string | null
  direccion_ciudad: string | null
  direccion_provincia: string | null
  direccion_codigo_postal: string | null
  direccion_pais: string
  created_at: string
  updated_at: string
}

export type Pedido = {
  id: string
  usuario_id: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  coste_envio: number
  total: number
  moneda: string
  direccion_pedido: any
  direccion_pago: any
  metodo_pago: string | null
  pago_id: string | null
  tracking_numero: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export type ItemPedido = {
  id: string
  pedido_id: string
  producto_id: string
  variante_id: string | null
  titulo_producto: string
  img_producto: string | null
  cantidad: number
  precio: number
  created_at: string
}

export type Wishlist = {
  id: string
  usuario_id: string
  producto_id: string
  created_at: string
}
