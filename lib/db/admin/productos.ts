import type { Producto, ProductoImagen, ProductoVariante } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProductoAdmin = Producto & {
  producto_imagenes: ProductoImagen[];
  producto_variantes: ProductoVariante[];
};

export const PRODUCTOS_POR_PAGINA = 20;

export type FiltrosProductos = {
  busqueda?: string;
  categoriaId?: string;
  status?: string;
  /** `stock`, `precio`, `titulo`, `creados` */
  orden?: string;
  page?: number;
};

export async function listProductosAdmin({
  busqueda,
  categoriaId,
  status,
  orden = "creados",
  page = 1,
}: FiltrosProductos = {}) {
  const supabase = createAdminClient();
  const pagina = Math.max(1, page);
  const desde = (pagina - 1) * PRODUCTOS_POR_PAGINA;

  let query = supabase
    .from("productos")
    .select(
      "*, producto_imagenes(id, producto_id, url, alt_text, orden_cat), producto_variantes(id, producto_id, titulo, precio, stock)",
      { count: "exact" },
    );

  if (busqueda) {
    const limpio = busqueda.replace(/[%,()]/g, " ").trim();
    if (limpio) {
      query = query.or(`titulo.ilike.%${limpio}%,sku.ilike.%${limpio}%`);
    }
  }

  if (categoriaId) {
    query = query.eq("categoria_id", categoriaId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  switch (orden) {
    case "stock":
      query = query.order("stock", { ascending: true });
      break;
    case "precio":
      query = query.order("precio", { ascending: true });
      break;
    case "titulo":
      query = query.order("titulo", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query
    .range(desde, desde + PRODUCTOS_POR_PAGINA - 1);

  if (error) {
    throw new Error("No hemos podido cargar los productos.");
  }

  const total = count ?? 0;

  return {
    productos: (data ?? []) as ProductoAdmin[],
    total,
    page: pagina,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA)),
  };
}

export async function getProductoAdmin(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("productos")
    .select(
      "*, producto_imagenes(*), producto_variantes(*), categorias(id, nombre, slug)",
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ProductoAdmin;
}

/** Nº de líneas de pedido que referencian este producto. */
export async function countPedidosDelProducto(id: string) {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("items_pedido")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", id);

  if (error) throw new Error("No hemos podido comprobar el historial del producto.");
  return count ?? 0;
}
