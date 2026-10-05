"use server";

import { getAdminContext, mensajeError } from "@/lib/admin/auth";
import { PEDIDO_STATUS } from "@/lib/admin/tipos";
import type { AdminActionState } from "@/lib/admin/tipos";
import { revalidatePath } from "next/cache";

function revalidar(pedidoId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  if (pedidoId) revalidatePath(`/admin/pedidos/${pedidoId}`);
}

/**
 * Cambia el estado de un pedido.
 *
 * `admin_pedido_update_status` devuelve el estado ANTERIOR, y eso es lo que
 * permite avisar del caso peligroso: nada repone stock automáticamente. La
 * lógica de stock vive en `crear_pedido`, que solo resta; no hay trigger de
 * reposición porque una reposición silenciosa haría imposible auditar por qué
 * una unidad volvió a aparecer.
 */
export async function cambiarEstadoPedido(
  pedidoId: string,
  estado: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  if (!(PEDIDO_STATUS as readonly string[]).includes(estado)) {
    return { error: "El estado del pedido no es válido." };
  }

  const { data, error } = await ctx.supabase.rpc("admin_pedido_update_status", {
    p_pedido_id: pedidoId,
    p_status: estado,
  });

  if (error) {
    return {
      error: mensajeError(error) ?? "No se ha podido cambiar el estado.",
    };
  }

  revalidar(pedidoId);

  const anterior = typeof data === "string" ? data : null;

  if (anterior !== "cancelled" && estado === "cancelled") {
    return {
      success:
        "Pedido cancelado. Recuerda reponer el stock de las líneas a mano: " +
        "el sistema no lo hace automáticamente.",
    };
  }

  return { success: "Estado actualizado." };
}

export async function guardarSeguimiento(
  pedidoId: string,
  seguimiento: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase.rpc("admin_pedido_update_tracking", {
    p_pedido_id: pedidoId,
    p_tracking: seguimiento.trim(),
  });

  if (error)
    return { error: mensajeError(error) ?? "No se ha podido guardar." };

  revalidar(pedidoId);
  return { success: "Seguimiento guardado." };
}

/**
 * Notas internas del pedido.
 *
 * Ninguna vista de cliente expone `pedidos.notas` hoy. No introduzcas ninguna que
 * lo haga: es un campo para el equipo, no para la persona que compró.
 */
export async function guardarNotas(
  pedidoId: string,
  notas: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase.rpc("admin_pedido_update_notas", {
    p_pedido_id: pedidoId,
    p_notas: notas,
  });

  if (error)
    return { error: mensajeError(error) ?? "No se ha podido guardar." };

  revalidar(pedidoId);
  return { success: "Notas guardadas." };
}
