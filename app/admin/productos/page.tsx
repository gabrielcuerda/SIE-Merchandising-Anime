import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import Paginacion from "@/components/admin/paginacion";
import ProductoFila from "@/components/admin/producto-fila";
import ProductoFiltros from "@/components/admin/producto-filtros";
import { BOTON_PRIMARIO, Tabla } from "@/components/admin/campos";
import { Card, CardContent } from "@/components/ui";
import { listarProductos } from "@/lib/admin/productos";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Producto",
  "Precio",
  "Stock",
  "Estado",
  "Portada",
  "Creado",
  "",
];

/**
 * Listado de productos del panel.
 *
 * `force-dynamic` porque `next.config.ts` tiene `useCache: true` y un listado
 * de administración que se sirve cacheado es un panel que no refleja lo que
 * acabas de hacer.
 *
 * Los filtros y la paginación leen `searchParams`, así que los componentes que
 * los usan (`useSearchParams`) van dentro de `<Suspense>`.
 */
export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const una = (clave: string) => {
    const valor = params[clave];
    return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
  };

  const pagina = Number.parseInt(una("pagina"), 10) || 1;

  const { productos, total, paginas, porPagina } = await listarProductos({
    busqueda: una("q") || null,
    status: una("status") || null,
    pagina,
  });

  return (
    <AdminPage
      eyebrow="Catálogo"
      titulo="Productos"
      descripcion={`${total} ${total === 1 ? "producto" : "productos"} en el catálogo.`}
      acciones={
        <Link href="/admin/productos/nuevo" className={BOTON_PRIMARIO}>
          Nuevo producto
        </Link>
      }
    >
      <Suspense fallback={null}>
        <ProductoFiltros />
      </Suspense>

      {productos.length === 0 ? (
        <AdminVacio
          titulo={
            una("q") || una("status")
              ? "Ningún producto coincide con el filtro"
              : "Todavía no hay productos"
          }
          descripcion={
            una("q") || una("status")
              ? "Prueba a cambiar la búsqueda o a quitar el filtro de estado."
              : "El catálogo está vacío. Crea el primer producto para empezar a vender."
          }
          accion={
            <Link href="/admin/productos/nuevo" className={BOTON_PRIMARIO}>
              Nuevo producto
            </Link>
          }
        />
      ) : (
        <>
          <Card>
            <CardContent>
              <Tabla columnas={COLUMNAS}>
                {productos.map((producto) => (
                  <ProductoFila key={producto.id} producto={producto} />
                ))}
              </Tabla>
            </CardContent>
          </Card>

          <Suspense fallback={null}>
            <Paginacion
              pagina={pagina}
              paginas={paginas}
              total={total}
              porPagina={porPagina}
            />
          </Suspense>
        </>
      )}
    </AdminPage>
  );
}
