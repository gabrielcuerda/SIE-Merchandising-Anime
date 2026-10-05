import Link from "next/link";
import { Badge } from "@/components/ui";
import { fecha, idCorto, importe } from "@/lib/admin/formato";
import {
  PEDIDO_STATUS_LABEL,
  PEDIDO_STATUS_TONE,
  type PedidoAdmin,
  type PedidoStatus,
} from "@/lib/admin/tipos";

/**
 * Fila del listado de pedidos.
 *
 * Server Component puro: no hay acciones aquí, solo enlaces. El cambio de estado
 * vive en el detalle (`components/admin/pedido-estado.tsx`), que es donde tiene
 * sentido confirmar una cancelación.
 */
export default function PedidoFila({ pedido }: { pedido: PedidoAdmin }) {
  const estado = pedido.status as PedidoStatus;

  const lineas = pedido.items_pedido.reduce(
    (total, linea) => total + linea.cantidad,
    0,
  );

  const nombre = pedido.perfiles?.full_nombre;

  return (
    <tr>
      <td className="px-3 py-2.5">
        <Link
          href={`/admin/pedidos/${pedido.id}`}
          className="font-mono text-xs font-semibold text-ink-900 underline underline-offset-4 hover:text-brand-600"
        >
          {idCorto(pedido.id)}
        </Link>
        {pedido.tracking_numero ? (
          <p className="mt-0.5 text-xs text-ink-500">
            Seguimiento: {pedido.tracking_numero}
          </p>
        ) : null}
      </td>

      <td className="px-3 py-2.5 text-ink-700">{fecha(pedido.created_at)}</td>

      <td className="px-3 py-2.5">
        {nombre ? (
          <span className="block text-ink-900">{nombre}</span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
        {pedido.usuario_id ? (
          <Link
            href={`/admin/usuarios/${pedido.usuario_id}`}
            className="text-xs text-ink-500 underline underline-offset-2 hover:text-brand-600"
          >
            Ver cuenta
          </Link>
        ) : (
          <span className="text-xs text-ink-400">Compra sin cuenta</span>
        )}
      </td>

      <td className="px-3 py-2.5 tabular-nums text-ink-700">{lineas}</td>

      <td className="px-3 py-2.5 font-semibold text-ink-900">
        {importe(pedido.total)}
      </td>

      <td className="px-3 py-2.5">
        <Badge tone={PEDIDO_STATUS_TONE[estado] ?? "neutral"} size="sm">
          {PEDIDO_STATUS_LABEL[estado] ?? estado}
        </Badge>
      </td>

      <td className="px-3 py-2.5 text-xs text-ink-500">
        {pedido.metodo_pago ?? "—"}
      </td>

      <td className="px-3 py-2.5 text-right">
        <Link
          href={`/admin/pedidos/${pedido.id}`}
          className="rounded-card px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100"
        >
          Abrir
        </Link>
      </td>
    </tr>
  );
}
