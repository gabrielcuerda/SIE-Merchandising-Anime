"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/actions/productos";
import { isPedidoStatus } from "@/lib/db/admin/pedidos";
import { AdminAuthError, assertAdmin } from "@/lib/supabase/require-admin";
import type { Pedido } from "@/lib/db/types";

function getValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function toErrorState(error: unknown, porDefecto: string): AdminActionState {
  if (error instanceof AdminAuthError || error instanceof Error) {
    return { error: error.message };
  }
  return { error: porDefecto };
}

/** Estado del pedido, número de seguimiento y notas internas. */
export async function updatePedido(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { admin } = await assertAdmin();

    const id = getValue(formData, "id");
    if (!id) return { error: "El pedido no es válido." };

    const status = getValue(formData, "status");
    if (!isPedidoStatus(status)) {
      return { error: "Selecciona un estado válido." };
    }

    const { data: actual } = await admin
      .from("pedidos")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (!actual) return { error: "El pedido ya no existe." };

    const payload: Partial<Pedido> = {
      status,
      tracking_numero: getValue(formData, "tracking_numero") || null,
      notas: getValue(formData, "notas") || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("pedidos").update(payload).eq("id", id);
    if (error) {
      return { error: "No hemos podido guardar los cambios del pedido." };
    }

    revalidatePath(`/admin/pedidos/${id}`);
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    // El cliente ve el estado del pedido en su cuenta.
    revalidatePath("/account/orders");

    return {
      success:
        actual.status === status
          ? "Cambios guardados."
          : `Estado actualizado a "${status}".`,
    };
  } catch (error) {
    return toErrorState(error, "No hemos podido guardar el pedido.");
  }
}
