import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import { StatCard } from "@/components/admin/stat-card";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getMetricas } from "@/lib/admin/metricas";
import { importeRedondeado, numero } from "@/lib/admin/formato";
import { PEDIDO_STATUS_LABEL, type PedidoStatus } from "@/lib/admin/tipos";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Dashboard del panel.
 *
 * Todas las cifras vienen de una única llamada a `admin_metricas()`. `pedidos`
 * está vacía en la base de datos, así que los contadores de pedidos y la
 * facturación saldrán a 0: eso es el dato real, no un fallo, y por eso no se
 * rellena nada con ejemplos.
 */
export default async function AdminDashboard() {
  const metricas = await getMetricas();

  if (!metricas) {
    return (
      <AdminPage titulo="Resumen">
        <AdminVacio
          titulo="No se han podido leer las métricas"
          descripcion="La base de datos ha rechazado la consulta. Comprueba que la migración 20261004000000_admin_p5.sql está aplicada y que tu usuario tiene app_metadata con role=admin."
        />
      </AdminPage>
    );
  }

  const { productos, categorias, pedidos, usuarios } = metricas;

  const reparto = Object.entries(pedidos.por_estado).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <AdminPage
      eyebrow="Panel"
      titulo="Resumen"
      descripcion="Estado de la tienda y de las últimas ventas."
    >
      <section aria-labelledby="seccion-catalogo" className="mb-8">
        <h2
          id="seccion-catalogo"
          className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-ink-500"
        >
          Catálogo
        </h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Productos"
            value={numero(productos.total)}
            hint={`${numero(productos.sin_categoria)} sin categoría`}
            href="/admin/productos"
          />
          <StatCard
            label="Stock bajo"
            value={numero(productos.stock_bajo)}
            hint="5 unidades o menos"
            tone={productos.stock_bajo > 0 ? "alerta" : "neutro"}
            href="/admin/productos"
          />
          <StatCard
            label="Destacados"
            value={numero(productos.destacados)}
            hint="Aparecen en la portada"
            tone="marca"
            href="/admin/productos"
          />
          <StatCard
            label="Sin imagen"
            value={numero(productos.sin_imagen)}
            hint="Sin foto en la ficha"
            tone={productos.sin_imagen > 0 ? "alerta" : "neutro"}
            href="/admin/productos"
          />
          <StatCard
            label="Categorías"
            value={numero(categorias.total)}
            hint={`${numero(categorias.sin_productos)} vacías`}
            href="/admin/categorias"
          />
          <StatCard
            label="Usuarios"
            value={numero(usuarios.total)}
            hint="Cuentas registradas"
            href="/admin/usuarios"
          />
        </div>
      </section>

      <section aria-labelledby="seccion-ventas" className="mb-8">
        <h2
          id="seccion-ventas"
          className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-ink-500"
        >
          Ventas
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Pedidos"
            value={numero(pedidos.total)}
            href="/admin/pedidos"
          />
          <StatCard
            label="Facturación 30 días"
            value={importeRedondeado(pedidos.facturacion_30d)}
            hint="Pedidos pagados, enviados o entregados"
            tone="marca"
          />
          <StatCard
            label="Facturación total"
            value={importeRedondeado(pedidos.facturacion_total)}
            hint="Histórico completo"
          />
        </div>

        {pedidos.total === 0 ? (
          <div className="mt-4">
            <AdminVacio
              titulo="Todavía no hay pedidos"
              descripcion="No hay ninguno en la base de datos. Los pedidos los crea el webhook de Stripe al confirmar el pago, así que aparecerán aquí en cuanto se complete una compra real."
              accion={
                <Link
                  href="/admin/pedidos"
                  className="text-sm font-semibold text-brand-600 underline underline-offset-4 hover:text-brand-700"
                >
                  Ir a pedidos
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reparto por estado</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {reparto.map(([status, n]) => (
                    <li
                      key={status}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-ink-700">
                        {PEDIDO_STATUS_LABEL[status as PedidoStatus] ?? status}
                      </span>
                      <Badge tone="neutral" size="sm">
                        {numero(n)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimos pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y divide-ink-100">
                  {pedidos.ultimos.map((pedido) => (
                    <li
                      key={pedido.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <Link
                        href={`/admin/pedidos/${pedido.id}`}
                        className="text-sm font-medium text-ink-900 underline underline-offset-4 hover:text-brand-600"
                      >
                        {pedido.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <span className="text-xs text-ink-500">
                        {importeRedondeado(pedido.total)}
                      </span>
                      <Badge tone="neutral" size="sm">
                        {PEDIDO_STATUS_LABEL[pedido.status as PedidoStatus] ??
                          pedido.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </AdminPage>
  );
}
