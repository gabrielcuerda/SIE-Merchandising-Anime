import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ToggleAdminButton,
  UserProfileForm,
} from "@/components/admin/usuarios/user-forms";
import { Badge } from "@/components/admin/ui/badge";
import {
  EmptyState,
  Panel,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui/panel";
import {
  currencyFormatter,
  dateTimeFormatter,
  pedidoStatusLabels,
  pedidoStatusTones,
} from "@/lib/admin/constants";
import { getUsuarioAdmin } from "@/lib/db/admin/usuarios";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Detalle del usuario" };

export default async function UsuarioDetallePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { user: adminActual } = await requireAdmin();
  const { id } = await props.params;

  const usuario = await getUsuarioAdmin(id);
  if (!usuario) notFound();

  const esElPropioAdmin = adminActual.id === usuario.id;
  const money = currencyFormatter("EUR");

  const pedidos = usuario.pedidos ?? [];
  const unidades = pedidos.reduce(
    (total, pedido) =>
      total +
      (pedido.items_pedido ?? []).reduce(
        (suma, item) => suma + (item.cantidad ?? 0),
        0,
      ),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/admin/usuarios" className="hover:underline">
              ← Usuarios
            </Link>
          </p>
          <h2 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
            {usuario.perfil?.full_nombre ?? usuario.email}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {usuario.email}
          </p>
        </div>

        <span className="flex flex-wrap gap-2">
          {usuario.es_admin ? <Badge tone="info">Administrador</Badge> : null}
          {usuario.confirmado ? (
            <Badge tone="success">Email confirmado</Badge>
          ) : (
            <Badge tone="warning">Email sin confirmar</Badge>
          )}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel
            title="Datos y dirección"
            description="Los mismos campos que el cliente edita en su cuenta."
          >
            {usuario.perfil ? (
              <UserProfileForm usuarioId={usuario.id} perfil={usuario.perfil} />
            ) : (
              <EmptyState
                title="Este usuario no tiene ficha de perfil"
                description="Se crea automáticamente la primera vez que entra en /account."
              />
            )}
          </Panel>

          <Panel
            title="Historial de pedidos"
            description={`${pedidos.length} pedido${
              pedidos.length === 1 ? "" : "s"
            } · ${unidades} artículo${unidades === 1 ? "" : "s"}.`}
          >
            {pedidos.length === 0 ? (
              <EmptyState title="Todavía no ha realizado ningún pedido" />
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
                  {pedidos.map((pedido) => (
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
                        {currencyFormatter(pedido.moneda).format(
                          Number(pedido.total),
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Cuenta">
            <dl className="flex flex-col gap-3 p-5 text-sm">
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Alta
                </dt>
                <dd className="mt-0.5">
                  {dateTimeFormatter.format(new Date(usuario.created_at))}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Último acceso
                </dt>
                <dd className="mt-0.5">
                  {usuario.ultimo_acceso
                    ? dateTimeFormatter.format(
                        new Date(usuario.ultimo_acceso),
                      )
                    : "Nunca ha iniciado sesión"}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Identificador
                </dt>
                <dd className="mt-0.5 font-mono text-xs break-all">
                  {usuario.id}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Gastado">
            <p className="p-5">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {money.format(
                  pedidos
                    .filter((pedido) => pedido.status !== "cancelled")
                    .reduce(
                      (total, pedido) => total + Number(pedido.total ?? 0),
                      0,
                    ),
                )}
              </span>
              <span className="mt-1 block text-sm text-neutral-500 dark:text-neutral-400">
                excluye pedidos cancelados
              </span>
            </p>
          </Panel>

          <Panel
            title="Acceso al panel"
            description="Un administrador puede entrar en /admin y gestionar todo."
          >
            <div className="p-5">
              <ToggleAdminButton
                usuarioId={usuario.id}
                email={usuario.email}
                esAdmin={usuario.es_admin}
                esElPropioAdmin={esElPropioAdmin}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
