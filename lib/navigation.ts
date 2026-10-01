export type NavCategoria = {
  id: string;
  nombre: string;
  slug: string;
  hijas: { id: string; nombre: string; slug: string }[];
};

/**
 * Carga las categorías para la navegación. Se importa de forma diferida y con
 * captura de errores para que la cabecera siga funcionando aunque Supabase no
 * esté configurado o la consulta falle.
 */
export async function getNavCategorias(): Promise<NavCategoria[]> {
  try {
    const { getCategoriasJerarquicas } = await import("@/lib/db/categorias");
    const categorias = await getCategoriasJerarquicas();

    return categorias.map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      slug: categoria.slug,
      hijas: categoria.hijas.map((hija) => ({
        id: hija.id,
        nombre: hija.nombre,
        slug: hija.slug,
      })),
    }));
  } catch {
    return [];
  }
}
