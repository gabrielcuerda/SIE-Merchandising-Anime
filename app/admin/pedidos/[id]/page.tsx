import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderForm } from "@/components/admin/pedidos/order-form";
import { Badge } from "@/components/admin/ui/badge";
import {
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
import {
  getPedidoAdmin,
  leerDireccion,
  type Direccion,
} from "@/lib/db/admin/pedidos";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Detalle del pedido" };

export default async function PedidoDetallePage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;
  const pedido = await getPedidoAdmin(id);

  if (!pedido) notFound();

  const money = currencyFormatter(pedido.moneda);
  const envio = leerDireccion(pedido.direccion_pedido);
  const facturacion = leerDireccion(pedido.direccion_pago);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/admin/pedidos" className="hover:underline">
              ← Pedidos
            </Link>
          </p>
          <h2 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
            Pedido #{pedido.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Creado el {dateTimeFormatter.format(new Date(pedido.created_at))}
            {pedido.updated_at !== pedido.created_at
              ? ` · actualizado el ${dateTimeFormatter.format(
                  new Date(pedido.updated_at),
                )}`
              : ""}
          </p>
        </div>

        <Badge tone={pedidoStatusTones[pedido.status]}>
          {pedidoStatusLabels[pedido.status]}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Artículos">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th className="text-right">Precio</Th>
                  <Th className="text-right">Cantidad</Th>
                  <Th className="text-right">Subtotal</Th>
                </tr>
              </thead>
              <tbody>
                {(pedido.items_pedido ?? []).map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
                          {item.img_producto ? (
                            <Image
                              src={item.img_producto}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-contain"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {item.titulo_producto}
                          </span>
                          {item.producto_id ? (
                            <Link
                              href={`/admin/productos/${item.producto_id}`}
                              className="text-xs text-blue-700 hover:underline dark:text-blue-400"
                            >
                              Ver producto
                            </Link>
                          ) : null}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {money.format(Number(item.precio))}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {item.cantidad}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">
                      {money.format(Number(item.precio) * item.cantidad)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>

            <dl className="flex flex-col gap-1 border-t border-neutral-200 p-5 text-sm dark:border-neutral-800">
              <Row termino="Subtotal" valor={money.format(Number(pedido.subtotal))} />
              <Row termino="Envío" valor={money.format(Number(pedido.coste_envio))} />
              <div className="mt-1 flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {money.format(Number(pedido.total))}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Gestión">
            <OrderForm
              pedidoId={pedido.id}
              status={pedido.status}
              trackingNumero={pedido.tracking_numero ?? ""}
              notas={pedido.notas ?? ""}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Cliente">
            <dl className="flex flex-col gap-3 p-5 text-sm">
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Nombre
                </dt>
                <dd className="mt-0.5">
                  {pedido.profiles?.full_nombre ?? "—"}
                </dd>
              </div>

              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Cuenta
                </dt>
                <dd className="mt-0.5">
                  {pedido.usuario_id ? (
                    <Link
                      href={`/admin/usuarios/${pedido.usuario_id}`}
                      className="font-mono text-xs text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {pedido.usuario_id}
                    </Link>
                  ) : (
                    <span className="text-neutral-500">Pedido invitado</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Teléfono
                </dt>
                <dd className="mt-0.5">{envio?.telefono ?? pedido.profiles?.telefono ?? "—"}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Dirección de envío">
            <DireccionCard direccion={envio} vacio="No se guardó dirección de envío." />
          </Panel>

          {pedido.direccion_pago ? (
            <Panel title="Dirección de facturación">
              <DireccionCard
                direccion={facturacion}
                vacio="No se guardó dirección de facturación."
              />
            </Panel>
          ) : null}

          <Panel title="Pago">
            <dl className="flex flex-col gap-3 p-5 text-sm">
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Método
                </dt>
                <dd className="mt-0.5 capitalize">
                  {pedido.metodo_pago ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  Identificador
                </dt>
                <dd className="mt-0.5 font-mono text-xs break-all">
                  {pedido.pago_id ?? "—"}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-500 dark:text-neutral-400">{termino}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}

function DireccionCard({
  direccion,
  vacio,
}: {
  direccion: Direccion | null;
  vacio: string;
}) {
  if (!direccion) {
    return <p className="p-5 text-sm text-neutral-500">{vacio}</p>;
  }

  return (
    <address className="p-5 text-sm not-italic">
      {direccion.nombre ? (
        <p className="font-medium">{direccion.nombre}</p>
      ) : null}
      {direccion.calle ? <p>{direccion.calle}</p> : null}
      <p>
        {[direccion.codigo_postal, direccion.ciudad]
          .filter(Boolean)
          .join(" ")}
        {direccion.provincia ? `, ${direccion.provincia}` : ""}
      </p>
      {direccion.pais ? <p>{direccion.pais}</p> : null}
    </address>
  );
}
