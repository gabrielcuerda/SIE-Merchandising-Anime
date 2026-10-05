"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductoAdmin } from "@/lib/admin/tipos";
import { Badge } from "@/components/ui";
import {
  alternarDestacado,
  eliminarProducto,
  ajustarStock,
} from "@/app/admin/productos/actions";
import { fecha, precioSinIVA } from "@/lib/admin/formato";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTransition } from "react";

/**
 * Fila de producto del listado.
 *
 * `components/ui` no tiene `Table`, así que la tabla se construye en
 * `components/admin/campos.tsx` con `<table>` semántico. Cada fila expone las
 * acciones que se pueden resolver sin abrir el editor: destacar, ajustar stock y
 * borrar. Todas son `useTransition` + action directa, el patrón de
 * `components/wishlist/wishlist-toggle.tsx`.
 */
export default function ProductoFila({
  producto,
}: {
  producto: ProductoAdmin;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  const principal = [...producto.producto_imagenes].sort(
    (a, b) => a.orden_cat - b.orden_cat,
  )[0];

  const ejecutar = (
    accion: () => Promise<{ success?: string; error?: string }>,
    confirmar?: string,
  ) => {
    if (confirmar && !window.confirm(confirmar)) return;

    iniciarTransicion(async () => {
      // `resultado` puede ser undefined: las actions que terminan en
      // `redirect()` (como eliminarProducto) navegan en lugar de devolver estado.
      const resultado = await accion();

      if (resultado?.error) {
        toast.error(resultado.error);
      } else if (resultado?.success) {
        toast.success(resultado.success);
      }

      router.refresh();
    });
  };

  return (
    <tr className={pendiente ? "opacity-60" : undefined}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-card border border-ink-200 bg-ink-50">
            {principal ? (
              <Image
                src={principal.url}
                alt={principal.alt_text ?? producto.titulo}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-semibold text-ink-400">
                {producto.titulo.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/productos/${producto.id}`}
              className="block truncate font-semibold text-ink-900 underline-offset-4 hover:text-brand-600 hover:underline"
            >
              {producto.titulo}
            </Link>
            <p className="truncate text-xs text-ink-500">
              {producto.sku ?? "Sin SKU"}
              {producto.categorias ? ` · ${producto.categorias.nombre}` : ""}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-2.5 font-semibold text-ink-900">
        {precioSinIVA(producto.precio)}
      </td>

      <td className="px-3 py-2.5">
        <span className="tabular-nums text-ink-700">{producto.stock}</span>
        <span className="ml-1 text-xs text-ink-400">uds.</span>
      </td>

      <td className="px-3 py-2.5">
        <Link href={`/admin/productos/${producto.id}`}>
          <Badge
            tone={producto.status === "oferta" ? "brand" : "neutral"}
            size="sm"
          >
            {producto.status}
          </Badge>
        </Link>
      </td>

      <td className="px-3 py-2.5">
        {producto.destacado ? (
          <Badge tone="brand" size="sm">
            Destacado
          </Badge>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        )}
      </td>

      <td className="px-3 py-2.5 text-xs text-ink-500">
        {fecha(producto.created_at)}
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/productos/${producto.id}`}
            className="rounded-card px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100"
          >
            Editar
          </Link>

          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              ejecutar(() =>
                alternarDestacado(producto.id, !producto.destacado),
              )
            }
            className="rounded-card px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-50"
          >
            {producto.destacado ? "Quitar destacado" : "Destacar"}
          </button>

          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              const bruto = window.prompt(
                `Stock actual de «${producto.titulo}»: ${producto.stock}.\nEscribe el nuevo (0 o más).`,
                String(producto.stock),
              );
              if (bruto === null) return;

              const n = Number.parseInt(bruto, 10);
              if (!Number.isInteger(n) || n < 0) {
                toast.error(
                  "El stock debe ser un número entero mayor o igual que 0.",
                );
                return;
              }

              ejecutar(() => ajustarStock(producto.id, n));
            }}
            className="rounded-card px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-50"
          >
            Stock
          </button>

          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              ejecutar(
                () => eliminarProducto(producto.id),
                `¿Eliminar «${producto.titulo}»?\n\nSe borrarán también sus imágenes y variantes. Los pedidos que ya lo incluyen siguen intactos, pero el producto dejará de estar en el catálogo y no se puede deshacer.`,
              )
            }
            className="rounded-card px-2 py-1 text-xs font-semibold text-alert-700 hover:bg-alert-50 disabled:opacity-50"
          >
            Borrar
          </button>
        </div>
      </td>
    </tr>
  );
}
