import Image from "next/image";
import Link from "next/link";
import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import PedidoGestion from "@/components/admin/pedido-gestion";
import { Seccion } from "@/components/admin/campos";
import {
  AlertBanner,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { desglose, obtenerPedido } from "@/lib/admin/pedidos";
import { fecha, fechaYhora, idCorto, importe } from "@/lib/admin/formato";
import { obtenerEstadoFactura } from "@/lib/email/enviar-factura";
import {
  PEDIDO_STATUS_LABEL,
  PEDIDO_STATUS_TONE,
  type PedidoStatus,
} from "@/lib/admin/tipos";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Detalle de un pedido.
 *
 * Dos decisiones que conviene no deshacer:
 *
 * 1. Las líneas se muestran con los SNAPSHOTS de `items_pedido`
 *    (`titulo_producto`, `img_producto`, `precio`), no reconsultando el producto.
 *    Si se reconsultara, un pedido antiguo dejaría de cuadrar en cuanto el precio
 *    cambiara o el producto se borrara del catálogo.
 *
 * 2. El desglose del IVA se lee del jsonb `direccion_pago`: no hay columna de
 *    IVA en `pedidos`.
 */
export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await obtenerPedido(id);

  if (!pedido) notFound();

  const estado = pedido.status as PedidoStatus;
  const cuentas = desglose(pedido);
  const direccion = pedido.direccion_pedido;
  const unidades = pedido.items_pedido.reduce((t, l) => t + l.cantidad, 0);

  return (
    <AdminPage
      eyebrow="Ventas"
      titulo={`Pedido ${idCorto(pedido.id)}`}
      descripcion={`${fechaYhora(pedido.created_at)} · ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`}
      acciones={
        <Badge tone={PEDIDO_STATUS_TONE[estado] ?? "neutral"} size="lg">
          {PEDIDO_STATUS_LABEL[estado] ?? estado}
        </Badge>
      }
    >
      <div className="mb-6">
        <AlertBanner tone="info">
          El panel no gestiona pagos. Para reembolsar o cobrar una diferencia,
          hazlo desde <strong>Stripe Dashboard</strong> usando el identificador{" "}
          <code className="font-mono">{pedido.pago_id ?? "sin pagoid"}</code>.
        </AlertBanner>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
        <div>
          <Seccion
            titulo="Líneas"
            descripcion="Snapshot del momento de la compra."
          >
            {pedido.items_pedido.length === 0 ? (
              <AdminVacio
                titulo="Pedido sin líneas"
                descripcion="Es raro: los pedidos se crean siempre con sus líneas. Si ves esto, el pedido se insertó a mano."
              />
            ) : (
              <Card>
                <CardContent>
                  <ul className="flex flex-col divide-y divide-ink-100">
                    {pedido.items_pedido.map((linea) => (
                      <li
                        key={linea.id}
                        className="flex items-center gap-4 py-3"
                      >
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-card border border-ink-200 bg-ink-50">
                          {linea.img_producto ? (
                            <Image
                              src={linea.img_producto}
                              alt={linea.titulo_producto}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-xs font-semibold text-ink-400">
                              —
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink-900">
                            {linea.titulo_producto}
                          </p>
                          <p className="text-xs text-ink-500">
                            {linea.cantidad} × {importe(linea.precio)}
                          </p>
                        </div>

                        <p className="shrink-0 font-semibold text-ink-900">
                          {importe(linea.cantidad * linea.precio)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </Seccion>

          <Seccion titulo="Desglose económico">
            <Card>
              <CardContent>
                <dl className="flex flex-col gap-2 text-sm">
                  <Fila termino="Subtotal" valor={importe(cuentas.subtotal)} />
                  <Fila
                    termino={
                      cuentas.ivaPorcentaje !== null
                        ? `IVA (${cuentas.ivaPorcentaje} %)`
                        : "IVA"
                    }
                    valor={
                      cuentas.iva !== null
                        ? importe(cuentas.iva)
                        : "No desglosado"
                    }
                  />
                  <Fila termino="Envío" valor={importe(cuentas.costeEnvio)} />
                  <div className="mt-1 flex items-baseline justify-between border-t border-ink-200 pt-2">
                    <dt className="font-bold text-ink-950">Total</dt>
                    <dd className="text-lg font-extrabold text-ink-950">
                      {importe(cuentas.total)}
                    </dd>
                  </div>
                </dl>

                {cuentas.estimado ? (
                  <p className="mt-3 text-xs text-ink-500">
                    Este pedido no tiene desglose guardado en{" "}
                    <code className="font-mono">direccion_pago</code>, así que
                    las cifras se han reconstruido desde las columnas numéricas.
                    El IVA puede no coincidir.
                  </p>
                ) : null}

                <dl className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 text-sm">
                  <Fila termino="Moneda" valor={pedido.moneda} />
                  <Fila
                    termino="Método de pago"
                    valor={pedido.metodo_pago ?? "—"}
                  />
                  <Fila
                    termino="Identificador de pago"
                    valor={pedido.pago_id ?? "—"}
                  />
                </dl>
              </CardContent>
            </Card>
          </Seccion>

          <Seccion titulo="Dirección de envío">
            <Card>
              <CardContent>
                {direccion ? (
                  <address className="text-sm not-italic leading-relaxed text-ink-700">
                    {direccion.nombre ? (
                      <span className="block font-semibold text-ink-900">
                        {direccion.nombre}
                      </span>
                    ) : null}
                    {direccion.calle ? (
                      <span className="block">{direccion.calle}</span>
                    ) : null}
                    <span className="block">
                      {[direccion.codigo_postal, direccion.ciudad]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    <span className="block">
                      {[direccion.provincia, direccion.pais]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    {direccion.telefono ? (
                      <span className="block text-ink-500">
                        {direccion.telefono}
                      </span>
                    ) : null}
                    {direccion.email ? (
                      <span className="block text-ink-500">
                        {direccion.email}
                      </span>
                    ) : null}
                  </address>
                ) : (
                  <p className="text-sm text-ink-400">
                    Este pedido se creó sin dirección guardada.
                  </p>
                )}
              </CardContent>
            </Card>
          </Seccion>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gestión</CardTitle>
            </CardHeader>
            <CardContent>
              <PedidoGestion
                pedidoId={pedido.id}
                estado={estado}
                tracking={pedido.tracking_numero}
                notas={pedido.notas}
                email={direccion?.email ?? null}
                factura={await obtenerEstadoFactura(pedido.id)}
                pagoId={pedido.pago_id}
              />
            </CardContent>
          </Card>

          {pedido.usuario_id ? (
            <div className="mt-4">
              <Link
                href={`/admin/usuarios/${pedido.usuario_id}`}
                className="text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-950"
              >
                Ver la cuenta que hizo este pedido →
              </Link>
            </div>
          ) : null}

          <p className="mt-4 text-xs text-ink-500">
            Actualizado {fecha(pedido.updated_at)}.
          </p>
        </div>
      </div>
    </AdminPage>
  );
}

function Fila({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-600">{termino}</dt>
      <dd className="font-medium text-ink-900">{valor}</dd>
    </div>
  );
}
