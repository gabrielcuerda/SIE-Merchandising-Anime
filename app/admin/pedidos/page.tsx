import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import Paginacion from "@/components/admin/paginacion";
import PedidoFila from "@/components/admin/pedido-fila";
import PedidoFiltros from "@/components/admin/pedido-filtros";
import { Card, CardContent } from "@/components/ui";
import { listarPedidos } from "@/lib/admin/pedidos";
import { importe, numero } from "@/lib/admin/formato";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

/**
 * Listado de pedidos.
 *
 * `pedidos` está vacía en la base de datos, así que este listado normalmente
 * mostrará el estado vacío. Es el dato real y no se sustituye por ejemplos.
 */
export default async function AdminPedidosPage({
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

  const { pedidos, total, paginas, porPagina } = await listarPedidos({
    status: una("status") || null,
    desde: una("desde") || null,
    hasta: una("hasta") || null,
    pagina,
  });

  const suma = pedidos.reduce((total, pedido) => total + pedido.total, 0);

  return (
    <AdminPage
      eyebrow="Ventas"
      titulo="Pedidos"
      descripcion={`${numero(total)} ${total === 1 ? "pedido" : "pedidos"}. Esta página muestra ${importe(suma)} de los pedidos filtrados.`}
    >
      <Suspense fallback={null}>
        <PedidoFiltros />
      </Suspense>

      {pedidos.length === 0 ? (
        <AdminVacio
          titulo={
            una("status") || una("desde") || una("hasta")
              ? "Ningún pedido coincide con el filtro"
              : "Todavía no hay pedidos"
          }
          descripcion={
            una("status") || una("desde") || una("hasta")
              ? "Prueba a ampliar el rango de fechas o a quitar el filtro de estado."
              : "No hay ningún pedido en la base de datos. Los crea el webhook de Stripe al confirmar el pago de una compra, así que aparecerán aquí solos."
          }
        />
      ) : (
        <>
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-200">
                      {[
                        "Pedido",
                        "Fecha",
                        "Cliente",
                        "Líneas",
                        "Total",
                        "Estado",
                        "Pago",
                        "",
                      ].map((columna) => (
                        <th
                          key={columna}
                          scope="col"
                          className="px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-500"
                        >
                          {columna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {pedidos.map((pedido) => (
                      <PedidoFila key={pedido.id} pedido={pedido} />
                    ))}
                  </tbody>
                </table>
              </div>
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
