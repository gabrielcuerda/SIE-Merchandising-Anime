"use client";

import { useActionState } from "react";

import { updatePedido } from "@/app/admin/actions/pedidos";
import type { AdminActionState } from "@/app/admin/actions/productos";
import { Button } from "@/components/admin/ui/button";
import { Field, inputClass } from "@/components/admin/ui/form";
import { Panel } from "@/components/admin/ui/panel";
import { pedidoStatusLabels, type PedidoStatus } from "@/lib/admin/constants";

export function OrderForm({
  pedidoId,
  status,
  trackingNumero,
  notas,
}: {
  pedidoId: string;
  status: PedidoStatus;
  trackingNumero: string;
  notas: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    updatePedido,
    {},
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={pedidoId} />

      <div className="flex flex-col gap-5 p-5">
        <Field label="Estado del pedido" htmlFor="status">
          <select
            id="status"
            name="status"
            className={inputClass}
            defaultValue={status}
          >
            {Object.entries(pedidoStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Número de seguimiento"
          htmlFor="tracking_numero"
          hint="Lo ve el cliente en su cuenta."
        >
          <input
            id="tracking_numero"
            name="tracking_numero"
            className={inputClass}
            defaultValue={trackingNumero}
            maxLength={100}
          />
        </Field>

        <Field
          label="Notas internas"
          htmlFor="notas"
          hint="Sólo para el equipo. El cliente no las ve."
        >
          <textarea
            id="notas"
            name="notas"
            rows={4}
            className={inputClass}
            defaultValue={notas}
          />
        </Field>

        {state.success ? (
          <p
            role="status"
            className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            {state.success}
          </p>
        ) : null}
        {state.error ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {state.error}
          </p>
        ) : null}

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
