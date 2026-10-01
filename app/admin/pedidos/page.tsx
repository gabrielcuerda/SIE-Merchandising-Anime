import Link from "next/link";

import { Badge } from "@/components/admin/ui/badge";
import {
  EmptyState,
  Panel,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui/panel";
import { Pagination } from "@/components/admin/ui/pagination";
import {
  currencyFormatter,
  dateTimeFormatter,
  pedidoStatusLabels,
  pedidoStatusTones,
} from "@/lib/admin/constants";
import { listPedidosAdmin } from "@/lib/db/admin/pedidos";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pedidos" };

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
}>;

export default async function AdminPedidosPage(props: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? "1") || 1;

  const { pedidos, total, totalPages } = await listPedidosAdmin({
    status: searchParams.status,
    busqueda: searchParams.q,
    page,
  });

  const buildHref = (destino: number) => {
    const params = new URLSearchParams();
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.q) params.set("q", searchParams.q);
    if (destino > 1) params.set("page", String(destino));
    const query = params.toString();
    return `/admin/pedidos${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Pedidos
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {total === 0
            ? "No hay pedidos que coincidan con el filtro."
            : `${total} pedido${total === 1 ? "" : "s"}.`}
        </p>
      </header>

      <form
        method="get"
        action="/admin/pedidos"
        className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div>
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={searchParams.q ?? ""}
            placeholder="ID de pedido, email o nombre"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300"
          >
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          >
            <option value="">Todos</option>
            {Object.entries(pedidoStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Filtrar
          </button>
          {(searchParams.status || searchParams.q) && (
            <Link
              href="/admin/pedidos"
              className="px-2 py-2 text-sm text-neutral-500 hover:underline"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <Panel>
        {pedidos.length === 0 ? (
          <EmptyState
            title="Ningún pedido coincide"
            description="Prueba a cambiar la búsqueda o el estado."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Pedido</Th>
                  <Th>Cliente</Th>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Artículos</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => {
                  const money = currencyFormatter(pedido.moneda);
                  const unidades = (pedido.items_pedido ?? []).reduce(
                    (total, item) => total + (item.cantidad ?? 0),
                    0,
                  );

                  return (
                    <Tr key={pedido.id}>
                      <Td>
                        <Link
                          href={`/admin/pedidos/${pedido.id}`}
                          className="font-medium hover:underline"
                        >
                          #{pedido.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </Td>
                      <Td>
                        <span className="block">
                          {pedido.profiles?.full_nombre ?? "Sin nombre"}
                        </span>
                        {pedido.usuario_id ? (
                          <span className="mt-0.5 block font-mono text-xs text-neutral-500 dark:text-neutral-400">
                            {pedido.usuario_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-xs text-neutral-500">
                            invitado
                          </span>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                        {dateTimeFormatter.format(new Date(pedido.created_at))}
                      </Td>
                      <Td>
                        <Badge tone={pedidoStatusTones[pedido.status]}>
                          {pedidoStatusLabels[pedido.status]}
                        </Badge>
                      </Td>
                      <Td className="text-right tabular-nums">{unidades}</Td>
                      <Td className="text-right font-medium tabular-nums">
                        {money.format(Number(pedido.total))}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>

            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </Panel>
    </div>
  );
}
