import { requireAdmin } from "@/lib/admin/auth";
import type { ProductoAdmin } from "@/lib/admin/tipos";
import { PRODUCTO_STATUS } from "@/lib/admin/tipos";

/**
 * Lecturas del catálogo para el panel.
 *
 * Todas van por el cliente de servidor (`@/lib/supabase/server`), que lleva la
 * sesión del admin. El catálogo público lo lee `lib/db/*` con el singleton sin
 * sesión; para administración no vale, y además habría que distinguir al admin
 * en cada consulta.
 *
 * `force-dynamic` en las páginas que las consumen: `next.config.ts` tiene
 * `useCache: true` y el contenido del panel cambia con cada escritura.
 */

const CAMPOS_LISTADO =
  "id, titulo, slug, descripcion, precio, categoria_id, status, stock, " +
  "destacado, tags, sku, created_at, updated_at, " +
  "producto_imagenes(id, url, alt_text, orden_cat), " +
  "categorias(nombre, slug)";

/** El editor necesita además las variantes completas. */
const CAMPOS_DETALLE = `${CAMPOS_LISTADO}, producto_variantes(id, producto_id, titulo, sku, precio, stock, opciones)`;

export const PRODUCTOS_POR_PAGINA = 20;

export type FiltroProductos = {
  busqueda?: string | null;
  status?: string | null;
  pagina?: number;
};

export type ListadoProductos = {
  productos: ProductoAdmin[];
  total: number;
  pagina: number;
  paginas: number;
  porPagina: number;
};

export async function listarProductos({
  busqueda = null,
  status = null,
  pagina = 1,
}: FiltroProductos = {}): Promise<ListadoProductos> {
  const { supabase } = await requireAdmin();

  const porPagina = PRODUCTOS_POR_PAGINA;
  const desde = (Math.max(pagina, 1) - 1) * porPagina;

  let consulta = supabase
    .from("productos")
    .select(CAMPOS_LISTADO, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(desde, desde + porPagina - 1);

  if (busqueda) {
    // `.or()` con ilike: el patrón es el que ya usa `lib/db/productos.ts`.
    const patron = busqueda.replace(/[,()]/g, " ");
    consulta = consulta.or(
      `titulo.ilike.%${patron}%,descripcion.ilike.%${patron}%,sku.ilike.%${patron}%`,
    );
  }

  if (status && (PRODUCTO_STATUS as readonly string[]).includes(status)) {
    consulta = consulta.eq("status", status);
  }

  const { data, error, count } = await consulta;

  if (error) {
    console.error("[admin] listarProductos:", error.message);
    return {
      productos: [],
      total: 0,
      pagina: 1,
      paginas: 1,
      porPagina,
    };
  }

  const total = count ?? 0;

  return {
    // Sin tipo `Database` generado, PostgREST no conoce estas relaciones y las
    // tipa como `GenericStringError`. El tipo real vive en `ProductoAdmin`.
    productos: (data ?? []) as unknown as ProductoAdmin[],
    total,
    pagina,
    paginas: Math.max(Math.ceil(total / porPagina), 1),
    porPagina,
  };
}

/** Ficha completa, con variantes incluidas, para el editor. */
export async function obtenerProducto(
  id: string,
): Promise<ProductoAdmin | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("productos")
    .select(CAMPOS_DETALLE)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] obtenerProducto:", error.message);
    return null;
  }

  return data as ProductoAdmin | null;
}

/** Slugs ya usados, para avisar de duplicados antes de enviar el formulario. */
export async function listarSlugs(exceptoId?: string): Promise<Set<string>> {
  const { supabase } = await requireAdmin();

  let consulta = supabase.from("productos").select("slug, id");
  if (exceptoId) consulta = consulta.neq("id", exceptoId);

  const { data, error } = await consulta;

  if (error) {
    console.error("[admin] listarSlugs:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((f) => String(f.slug)));
}
