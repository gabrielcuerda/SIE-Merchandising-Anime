import { getPedidoPorPago } from "@/lib/cart";
import {
  construirModeloFactura,
  formatearFecha,
  formatearImporte,
} from "@/lib/email/modelo";
import { getSitioUrl } from "@/lib/email/config";
import { datosFiscales } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImprimirFactura from "@/components/factura/imprimir-factura";

export const dynamic = "force-dynamic";

/**
 * Factura imprimible.
 *
 * Es a donde apunta el botón del email. Está fuera de `/account` a propósito:
 * el cliente que compró sin cuenta no tiene ninguna página de pedidos donde ver
 * su factura, y sin esta página su único rastro sería el PDF que le enviara
 * Stripe con otro formato y otro diseño.
 *
 * El acceso es el mismo que en `/order-confirmation`: vale conocer el `cs_...` de
 * la sesión de Stripe. Es un identificador de alta entropía que solo recibe quien
 * pagó, que además acaba de recibir esta misma factura por email desde Stripe.
 * Lo que cambia aquí es que el dato viaja en el texto del email del cliente, así
 * que quien lo intercepte tiene acceso a los datos de esa factura concreta.
 *
 * Las cifras salen de `construirModeloFactura`, la misma función que alimenta el
 * correo: email y web no pueden desajustarse.
 */
export default async function PaginaFactura({
  params,
}: {
  params: Promise<{ pago_id: string }>;
}) {
  const { pago_id } = await params;

  const pedido = await getPedidoPorPago(pago_id);

  if (!pedido) notFound();

  const modelo = construirModeloFactura(pedido, getSitioUrl());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="factura-no-imprimir mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/order-confirmation?session_id=${encodeURIComponent(pago_id)}`}
          className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400"
        >
          ← Volver a tu pedido
        </Link>
        <ImprimirFactura />
      </div>

      <article className="factura rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {datosFiscales.razonSocial}
            </h1>
            <address className="mt-1 text-sm not-italic leading-relaxed text-neutral-600 dark:text-neutral-400">
              NIF {datosFiscales.nif}
              <br />
              {datosFiscales.direccion}
              <br />
              {datosFiscales.telefono} ·{" "}
              <a
                href={`mailto:${datosFiscales.email}`}
                className="underline underline-offset-2"
              >
                {datosFiscales.email}
              </a>
            </address>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Factura
            </p>
            <p className="font-mono text-lg font-bold">{modelo.numero}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {formatearFecha(modelo.fecha)}
            </p>
          </div>
        </header>

        <div className="grid gap-8 border-b border-neutral-200 py-6 sm:grid-cols-2 dark:border-neutral-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Facturar a
            </h2>
            <p className="mt-2 font-medium">{modelo.cliente ?? "Cliente"}</p>
            {modelo.direccion && (
              <address className="mt-1 text-sm not-italic leading-relaxed text-neutral-600 dark:text-neutral-400">
                {modelo.direccion.calle}
                <br />
                {[modelo.direccion.codigo_postal, modelo.direccion.ciudad]
                  .filter(Boolean)
                  .join(" ")}
                {modelo.direccion.provincia ? (
                  <>
                    <br />
                    {modelo.direccion.provincia}
                  </>
                ) : null}
                <br />
                {modelo.direccion.pais}
              </address>
            )}
          </div>

          <div className="sm:text-right">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Datos del pedido
            </h2>
            <dl className="mt-2 space-y-1 text-sm sm:inline-block sm:text-left">
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-neutral-500">Referencia</dt>
                <dd className="font-mono font-medium">{modelo.referencia}</dd>
              </div>
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-neutral-500">Artículos</dt>
                <dd className="font-medium">{modelo.unidades}</dd>
              </div>
              <div className="flex gap-3 sm:justify-end">
                <dt className="text-neutral-500">Método de pago</dt>
                <dd className="font-medium capitalize">
                  {modelo.metodoPago ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th
                scope="col"
                className="py-3 pr-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500"
              >
                Descripción
              </th>
              <th
                scope="col"
                className="py-3 px-2 text-right text-xs font-bold uppercase tracking-widest text-neutral-500"
              >
                Cant.
              </th>
              <th
                scope="col"
                className="py-3 px-2 text-right text-xs font-bold uppercase tracking-widest text-neutral-500"
              >
                Precio
              </th>
              <th
                scope="col"
                className="py-3 pl-2 text-right text-xs font-bold uppercase tracking-widest text-neutral-500"
              >
                Importe
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {modelo.lineas.map((linea, indice) => (
              <tr key={indice}>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    {linea.imagen && (
                      <div className="relative size-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                        <Image
                          src={linea.imagen}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="font-medium">{linea.titulo}</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-right align-middle tabular-nums">
                  {linea.cantidad}
                </td>
                <td className="py-4 px-2 text-right align-middle whitespace-nowrap tabular-nums text-neutral-600 dark:text-neutral-400">
                  {formatearImporte(linea.precioUnitario, modelo.moneda)}
                </td>
                <td className="py-4 pl-2 text-right align-middle font-semibold whitespace-nowrap tabular-nums">
                  {formatearImporte(linea.total, modelo.moneda)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
          <Fila
            termino="Subtotal"
            valor={formatearImporte(modelo.subtotal, modelo.moneda)}
          />
          <Fila
            termino={`IVA (${modelo.ivaPorcentaje} %)`}
            valor={formatearImporte(modelo.iva, modelo.moneda)}
          />
          <Fila
            termino="Envío"
            valor={
              modelo.costeEnvio > 0
                ? formatearImporte(modelo.costeEnvio, modelo.moneda)
                : "Gratis"
            }
          />
          <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-base font-bold dark:border-neutral-100">
            <span>Total</span>
            <span>{formatearImporte(modelo.total, modelo.moneda)}</span>
          </div>
        </div>

        <footer className="mt-10 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-500 dark:border-neutral-800">
          <p>
            Precios con IVA desglosado en la tabla. Conservamos tus datos para
            gestionar el pedido y atender las devoluciones; puedes solicitar su
            baja desde{" "}
            <Link href="/privacidad" className="underline underline-offset-2">
              nuestra política de privacidad
            </Link>
            .
          </p>
          <p className="mt-2">
            ¿Alguna duda sobre esta factura? Responde a{" "}
            <a
              href={`mailto:${datosFiscales.email}`}
              className="underline underline-offset-2"
            >
              {datosFiscales.email}
            </a>{" "}
            indicando el número {modelo.numero}.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Fila({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-600 dark:text-neutral-400">{termino}</span>
      <span className="font-medium tabular-nums">{valor}</span>
    </div>
  );
}
