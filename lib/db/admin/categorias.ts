import type { Categoria } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type CategoriaConConteo = Categoria & {
  productos_count: number;
};

/**
 * Lista con el número de productos de cada categoría.
 *
 * El conteo se hace en una consulta aparte agrupando por `categoria_id`, en
 * vez de con un embed `productos(count)`: así el listado no depende de que
 * exista la FK `productos.categoria_id → categorias.id`, y además un producto
 * sin categoría se detecta sin outlawfila.
 */
export async function listCategoriasAdmin(): Promise<CategoriaConConteo[]> {
  const supabase = createAdminClient();

  const [{ data, error }, conteos] = await Promise.all([
    supabase.from("categorias").select("*").order("orden_cat", { ascending: true }),
    conteoProductosPorCategoria(supabase),
  ]);

  if (error) {
    throw new Error("No hemos podido cargar las categorías.");
  }

  return ((data ?? []) as Categoria[]).map((categoria) => ({
    ...categoria,
    productos_count: conteos.get(categoria.id) ?? 0,
  }));
}

/**
 * `categoria_id` es una columna real, así que se puede filtrar en el servidor
 * en vez de traer todos los productos y contarlos en JS.
 */
async function conteoProductosPorCategoria(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<Map<string, number>> {
  const conteos = new Map<string, number>();

  let pagina = 0;
  const porPagina = 1000;

  // Tope de seguridad: 50 páginas = 50.000 productos.
  while (pagina < 50) {
    const { data, error } = await supabase
      .from("productos")
      .select("categoria_id")
      .not("categoria_id", "is", null)
      .range(pagina * porPagina, pagina * porPagina + porPagina - 1);

    if (error || !data || data.length === 0) break;

    for (const fila of data as { categoria_id: string | null }[]) {
      if (!fila.categoria_id) continue;
      conteos.set(
        fila.categoria_id,
        (conteos.get(fila.categoria_id) ?? 0) + 1,
      );
    }

    if (data.length < porPagina) break;
    pagina += 1;
  }

  return conteos;
}

/** `parent_id` permitidos para una categoría: cualquiera salvo ella y sus hijas. */
export async function getPadresPermitidos(categoriaId?: string) {
  const categorias = await listCategoriasAdmin();

  if (!categoriaId) return categorias;

  const descendientes = new Set<string>([categoriaId]);
  let crescendo = true;

  // Se repite hasta que ya no aparezcan nuevos descendientes: el árbol puede
  // tener la profundidad que sea, no sólo dos niveles.
  while (crescendo) {
    crescendo = false;

    for (const categoria of categorias) {
      if (
        categoria.parent_id &&
        descendientes.has(categoria.parent_id) &&
        !descendientes.has(categoria.id)
      ) {
        descendientes.add(categoria.id);
        crescendo = true;
      }
    }
  }

  return categorias.filter((categoria) => !descendientes.has(categoria.id));
}

export async function countProductosDeCategoria(categoriaId: string) {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", categoriaId);

  if (error) throw new Error("No hemos podido comprobar la categoría.");
  return count ?? 0;
}

export async function countHijasDeCategoria(categoriaId: string) {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("categorias")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", categoriaId);

  if (error) throw new Error("No hemos podido comprobar la categoría.");
  return count ?? 0;
}
