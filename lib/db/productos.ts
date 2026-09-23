import { supabase } from '@/lib/supabase/client'
import type { Producto, ProductoImagen } from './types'

type ProductoConImagen = Producto & { producto_imagenes: ProductoImagen[] }

function orderProductos(
  queryBuilder: any,
  sortKey?: string,
  reverse?: boolean
) {
  switch (sortKey) {
    case 'PRICE':
      return queryBuilder.order('precio', { ascending: !reverse })
    case 'BEST_SELLING':
      return queryBuilder.order('stock', { ascending: false })
    case 'CREATED_AT':
      return queryBuilder.order('created_at', { ascending: false })
    case 'STOCK':
      return queryBuilder.order('stock', { ascending: false })
    default:
      return queryBuilder.order('created_at', { ascending: false })
  }
}

export async function getProductos({
  query,
  sortKey,
  reverse,
}: {
  query?: string
  sortKey?: string
  reverse?: boolean
} = {}) {
  let queryBuilder = supabase
    .from('productos')
    .select('*, producto_imagenes(*)')

  if (query) {
    queryBuilder = queryBuilder.or(
      `titulo.ilike.%${query}%,descripcion.ilike.%${query}%,tags.cs.{${query}}`
    )
  }

  queryBuilder = orderProductos(queryBuilder, sortKey, reverse)

  const { data, error } = await queryBuilder.limit(100)

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}

export async function getProducto(slug: string) {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*, orden_cat), producto_variantes(*)')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as Producto & {
    producto_imagenes: ProductoImagen[]
    producto_variantes: import('./types').ProductoVariante[]
  }
}

export async function getProductosByCategoria(
  categoriaSlug: string,
  { sortKey, reverse }: { sortKey?: string; reverse?: boolean } = {}
) {
  let queryBuilder = supabase
    .from('productos')
    .select('*, producto_imagenes(*), categorias!inner(id, nombre, slug)')
    .eq('categorias.slug', categoriaSlug)

  queryBuilder = orderProductos(queryBuilder, sortKey, reverse)

  const { data, error } = await queryBuilder

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}

export async function getProductosDestacados() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*)')
    .eq('destacado', true)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}

export async function getProductosOferta() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*)')
    .eq('status', 'oferta')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}

export async function getProductosPreVenta() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*)')
    .eq('status', 'pre-venta')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}

export async function getProductosMasVendidos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*)')
    .order('stock', { ascending: false })
    .limit(8)

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}

export async function getProductosRelacionados(
  productoId: string,
  categoriaId: string
) {
  const { data, error } = await supabase
    .from('productos')
    .select('*, producto_imagenes(*)')
    .eq('categoria_id', categoriaId)
    .neq('id', productoId)
    .limit(4)

  if (error) throw error
  return (data || []) as ProductoConImagen[]
}
