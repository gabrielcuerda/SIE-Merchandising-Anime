import { requireAdmin } from "@/lib/admin/auth";
import type { Categoria } from "@/lib/db/types";
import type { CategoriaAdmin, NodoCategoria } from "@/lib/admin/tipos";

/**
 * Lecturas de categorías para el panel.
 *
 * El número de productos por categoría se calcula con un `LEFT JOIN` en vez de
 * N+1: el listado_tree lo necesita para todas las filas a la vez.
 */
export async function listarCategoriasConConteo(): Promise<CategoriaAdmin[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("categorias")
    .select(
      "id, nombre, slug, parent_id, descripcion, image_url, orden_cat, created_at, " +
        "productos(count)",
    )
    .order("orden_cat", { ascending: true });

  if (error) {
    console.error("[admin] listarCategoriasConConteo:", error.message);
    return [];
  }

  // Sin tipo `Database` generado, PostgREST no conoce estas relaciones y las
  // tipa como `GenericStringError`. El paso por `unknown` documenta que la
  // aserción es deliberada; los tipos reales viven en `lib/admin/tipos.ts`.
  return (data ?? []).map((fila) => {
    const conteo = (fila as unknown as { productos?: { count?: number }[] })
      .productos;
    return {
      ...(fila as unknown as Omit<CategoriaAdmin, "total_productos">),
      total_productos: conteo?.[0]?.count ?? 0,
    };
  });
}

/** Categorías planas, para los `<select>` de producto. */
export async function listarCategorias(): Promise<Categoria[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("orden_cat", { ascending: true });

  if (error) {
    console.error("[admin] listarCategorias:", error.message);
    return [];
  }

  return (data ?? []) as Categoria[];
}

export async function obtenerCategoria(id: string): Promise<Categoria | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] obtenerCategoria:", error.message);
    return null;
  }

  return data as Categoria | null;
}

/**
 * Arbol de categorías para el listado del panel.
 *
 * El esquema admite un solo nivel (lo garantiza `admin_categoria_update`), pero
 * los datos actuales podrían traer algo más: agrupar por `parent_id` y dejar
 * cualquier huérfano en la raíz evita que una fila desaparezca de la vista.
 *
 * El tipo `NodoCategoria` vive en `@/lib/admin/tipos` porque lo consumen Client
 * Components; este módulo importa el cliente de Supabase de servidor.
 */
export function construirArbol(categorias: CategoriaAdmin[]): NodoCategoria[] {
  const porId = new Map<string, NodoCategoria>();
  for (const categoria of categorias) {
    porId.set(categoria.id, { ...categoria, hijas: [] });
  }

  const raices: NodoCategoria[] = [];

  for (const categoria of categorias) {
    const nodo = porId.get(categoria.id);
    if (!nodo) continue;

    const padre = categoria.parent_id ? porId.get(categoria.parent_id) : null;

    if (padre) {
      padre.hijas.push(nodo);
    } else {
      raices.push(nodo);
    }
  }

  const ordenar = (nodos: NodoCategoria[]) => {
    nodos.sort(
      (a, b) => a.orden_cat - b.orden_cat || a.nombre.localeCompare(b.nombre),
    );
    nodos.forEach((n) => ordenar(n.hijas));
  };

  ordenar(raices);

  return raices;
}
