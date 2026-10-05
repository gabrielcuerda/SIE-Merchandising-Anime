import Link from "next/link";
import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import CategoriaArbol from "@/components/admin/categoria-arbol";
import { BOTON_PRIMARIO } from "@/components/admin/campos";
import { Card, CardContent } from "@/components/ui";
import {
  construirArbol,
  listarCategoriasConConteo,
} from "@/lib/admin/categorias";

export const dynamic = "force-dynamic";

/**
 * Listado de categorías en árbol.
 *
 * `construirArbol` agrupa por `parent_id`. Cualquier categoría cuyo padre no
 * exista aparece en la raíz en lugar de desaparecer: es más útil verla suelta
 * que no verla.
 */
export default async function AdminCategoriasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const creada = typeof params.creada === "string" ? params.creada : null;

  const categorias = await listarCategoriasConConteo();
  const arbol = construirArbol(categorias);

  return (
    <AdminPage
      eyebrow="Catálogo"
      titulo="Categorías"
      descripcion={`${categorias.length} ${categorias.length === 1 ? "categoría" : "categorías"}. El orden es el que aparece en el menú de la tienda.`}
      acciones={
        <Link href="/admin/categorias/nueva" className={BOTON_PRIMARIO}>
          Nueva categoría
        </Link>
      }
    >
      {creada ? (
        <p
          role="status"
          className="mb-5 rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700"
        >
          Categoría creada.
        </p>
      ) : null}

      {arbol.length === 0 ? (
        <AdminVacio
          titulo="Todavía no hay categorías"
          descripcion="Sin categorías, los productos se muestran sin agrupar y el menú de la tienda queda vacío."
          accion={
            <Link href="/admin/categorias/nueva" className={BOTON_PRIMARIO}>
              Nueva categoría
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent>
            <CategoriaArbol nodos={arbol} />
          </CardContent>
        </Card>
      )}
    </AdminPage>
  );
}
