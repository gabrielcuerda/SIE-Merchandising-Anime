import {
  BanknotesIcon,
  CubeIcon,
  ShoppingBagIcon,
  TruckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { BarChart, RankRow } from "@/components/admin/charts/bar-chart";
import { Badge } from "@/components/admin/ui/badge";
import { LinkButton } from "@/components/admin/ui/button";
import {
  EmptyState,
  Panel,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui/panel";
import { StatCard, Trend } from "@/components/admin/ui/stat-card";
import {
  currencyFormatter,
  dateTimeFormatter,
  pedidoStatusLabels,
  pedidoStatusTones,
} from "@/lib/admin/constants";
import { getDashboardMetrics } from "@/lib/db/admin/metricas";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const metrics = await getDashboardMetrics();
  const money = currencyFormatter(metrics.moneda);

  const trendDe = (value: number | null) =>
    value === null
      ? undefined
      : {
          value: `${Math.abs(value).toFixed(0)}% vs. 30 días previos`,
          direction:
            value > 0.5 ? ("up" as const) : value < -0.5 ? ("down" as const) : ("flat" as const),
        };

  const maxUnidades = Math.max(...metrics.topProductos.map((p) => p.unidades), 1);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Resumen
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Ventas de los últimos 30 días y estado general de la tienda.
          </p>
        </div>
        <LinkButton href="/admin/productos/nuevo" variant="neutral">
          <CubeIcon aria-hidden className="h-4 w-4" />
          Nuevo producto
        </LinkButton>
      </header>

      {/* --- KPIs ---------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas (30 días)"
          value={money.format(metrics.ventas30d)}
          trend={trendDe(metrics.variacionVentas)}
          icon={<BanknotesIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Pedidos (30 días)"
          value={String(metrics.pedidos30d)}
          trend={trendDe(metrics.variacionPedidos)}
          icon={<ShoppingBagIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Ticket medio"
          value={money.format(metrics.ticketMedio)}
          hint="por pedido pagado"
          icon={<BanknotesIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Clientes registrados"
          value={String(metrics.totalUsuarios)}
          icon={<UsersIcon className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Productos en catálogo"
          value={String(metrics.totalProductos)}
          hint={`${metrics.productosActivos} disponibles`}
          icon={<CubeIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Pedidos por enviar"
          value={String(metrics.pedidosPendientes)}
          hint="pagados o pendientes, sin límite de fecha"
          icon={<TruckIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Stock bajo"
          value={String(metrics.stockBajo.length)}
          hint={`≤ 5 unidades${metrics.stockBajo.length === 10 ? " (top 10)" : ""}`}
          icon={<CubeIcon className="h-5 w-5" />}
        />
      </div>

      {/* --- Serie mensual + top productos ---------------------------------- */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title="Ventas por mes"
          description="Últimos 12 meses. Se excluyen pedidos pendientes y cancelados."
        >
          <BarChart
            data={metrics.serieMensual.map((mes) => ({
              label: mes.etiqueta,
              value: mes.total,
              displayValue: `${money.format(mes.total)} · ${mes.pedidos} pedido${
                mes.pedidos === 1 ? "" : "s"
              }`,
            }))}
            title="Ventas por mes de los últimos 12 meses"
            description={`Los últimos 30 días suman ${money.format(
              metrics.ventas30d,
            )} en ${metrics.pedidos30d} pedidos.`}
          />
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Productos más vendidos"
          description="Por unidades, últimos 12 meses."
        >
          {metrics.topProductos.length === 0 ? (
            <EmptyState
              title="Todavía no hay ventas"
              description="El ranking se rellenará en cuanto se complete el primer pedido."
            />
          ) : (
            <ul className="divide-y divide-neutral-200 py-2 dark:divide-neutral-800">
              {metrics.topProductos.map((producto, index) => (
                <RankRow
                  key={producto.producto_id}
                  rank={index + 1}
                  label={producto.titulo}
                  value={producto.unidades}
                  displayValue={`${producto.unidades} ud. · ${money.format(
                    producto.ingresos,
                  )}`}
                  max={maxUnidades}
                  href={`/admin/productos/${producto.producto_id}`}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* --- Pedidos por estado + últimos pedidos ---------------------------- */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-2"
          title="Pedidos por estado"
          description="Acumulado de los últimos 12 meses."
        >
          {metrics.pedidosPorEstado.length === 0 ? (
            <EmptyState title="Sin pedidos registrados" />
          ) : (
            <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
              {metrics.pedidosPorEstado.map((entry) => (
                <li
                  key={entry.status}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                >
                  <Badge tone={pedidoStatusTones[entry.status]}>
                    {pedidoStatusLabels[entry.status]}
                  </Badge>
                  <span className="font-medium tabular-nums">{entry.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-3"
          title="Últimos pedidos"
          description="Los 8 más recientes, de cualquier estado."
          action={
            <Link
              href="/admin/pedidos"
              className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              Ver todos
            </Link>
          }
        >
          {metrics.ultimosPedidos.length === 0 ? (
            <EmptyState title="Todavía no hay pedidos" />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Pedido</Th>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {metrics.ultimosPedidos.map((pedido) => (
                  <Tr key={pedido.id}>
                    <Td>
                      <Link
                        href={`/admin/pedidos/${pedido.id}`}
                        className="font-medium hover:underline"
                      >
                        #{pedido.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                      {dateTimeFormatter.format(new Date(pedido.created_at))}
                    </Td>
                    <Td>
                      <Badge tone={pedidoStatusTones[pedido.status]}>
                        {pedidoStatusLabels[pedido.status]}
                      </Badge>
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {money.format(Number(pedido.total))}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>

      {/* --- Stock bajo ------------------------------------------------------ */}
      {metrics.stockBajo.length > 0 ? (
        <Panel
          title="Reposición pendiente"
          description="Productos con 5 unidades o menos."
          action={
            <Link
              href="/admin/productos"
              className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              Gestionar productos
            </Link>
          }
        >
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {metrics.stockBajo.map((producto) => (
              <li
                key={producto.id}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
              >
                <span className="min-w-0">
                  <Link
                    href={`/admin/productos/${producto.id}`}
                    className="font-medium hover:underline"
                  >
                    {producto.titulo}
                  </Link>
                </span>
                <Badge tone={producto.stock === 0 ? "danger" : "warning"}>
                  {producto.stock === 0
                    ? "Sin stock"
                    : `${producto.stock} ud.`}
                </Badge>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            title="Todo el catálogo tiene stock"
            description="Ningún producto está por debajo de 5 unidades."
          />
        </Panel>
      )}
    </div>
  );
}
