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
import { currencyFormatter, dateFormatter } from "@/lib/admin/constants";
import { listUsuariosAdmin } from "@/lib/db/admin/usuarios";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Usuarios" };

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function AdminUsuariosPage(props: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? "1") || 1;

  const { usuarios, total, totalPages } = await listUsuariosAdmin(
    page,
    searchParams.q,
  );

  const buildHref = (destino: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (destino > 1) params.set("page", String(destino));
    const query = params.toString();
    return `/admin/usuarios${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Usuarios
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {total === 0
            ? "No hay cuentas registradas."
            : `${total} cuenta${total === 1 ? "" : "s"} registrada${
                total === 1 ? "" : "s"
              }.`}
        </p>
      </header>

      <form
        method="get"
        action="/admin/usuarios"
        className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div className="min-w-64 flex-1">
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
            placeholder="Email o nombre"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Buscar
        </button>
        {searchParams.q ? (
          <Link
            href="/admin/usuarios"
            className="px-2 py-2 text-sm text-neutral-500 hover:underline"
          >
            Limpiar
          </Link>
        ) : null}
      </form>

      <Panel>
        {usuarios.length === 0 ? (
          <EmptyState
            title="Ninguna cuenta coincide"
            description="Prueba con otro email o nombre."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Cliente</Th>
                  <Th>Alta</Th>
                  <Th>Último acceso</Th>
                  <Th className="text-right">Pedidos</Th>
                  <Th className="text-right">Total gastado</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <Tr key={usuario.id}>
                    <Td>
                      <Link
                        href={`/admin/usuarios/${usuario.id}`}
                        className="font-medium hover:underline"
                      >
                        {usuario.full_nombre ?? usuario.email}
                      </Link>
                      <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                        {usuario.email}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                      {dateFormatter.format(new Date(usuario.created_at))}
                    </Td>
                    <Td className="whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                      {usuario.ultimo_acceso
                        ? dateFormatter.format(new Date(usuario.ultimo_acceso))
                        : "Nunca"}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {usuario.num_pedidos}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {currencyFormatter(usuario.moneda).format(
                        usuario.total_gastado,
                      )}
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {usuario.es_admin ? (
                          <Badge tone="info">Admin</Badge>
                        ) : null}
                        {!usuario.confirmado ? (
                          <Badge tone="warning">Sin confirmar</Badge>
                        ) : null}
                        {usuario.email === "(cuenta eliminada)" ? (
                          <Badge tone="danger">Perfil huérfano</Badge>
                        ) : null}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>

            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </Panel>
    </div>
  );
}
