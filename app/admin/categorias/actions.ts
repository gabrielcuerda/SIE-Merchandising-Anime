"use server";

import { getAdminContext, mensajeError } from "@/lib/admin/auth";
import { slugify } from "@/lib/admin/imagen";
import type { AdminActionState } from "@/lib/admin/tipos";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function revalidar() {
  revalidatePath("/admin");
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/categorias/nueva");
  // El menú del navbar lee categorías, así que también hay que refrescarlo.
  revalidatePath("/", "layout");
}

/**
 * Alta de categoría.
 *
 * Todas las validaciones que importan (unicidad entre hermanos, ciclos, un solo
 * nivel de anidamiento) están en las RPC de la migración, no aquí: en cuanto
 * exista otra vía de escritura, unas validaciones que solo viven en el
 * formulario dejarían de estar garantizadas.
 */
export async function crearCategoria(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const nombre = texto(formData, "nombre");
  if (!nombre) return { error: "El nombre de la categoría es obligatorio." };

  const slugPropuesto = texto(formData, "slug");

  const { data, error } = await ctx.supabase.rpc("admin_categoria_create", {
    p_nombre: nombre,
    p_slug: slugPropuesto || slugify(nombre),
    p_parent_id: texto(formData, "parent_id") || null,
    p_descripcion: texto(formData, "descripcion") || null,
    p_image_url: texto(formData, "image_url") || null,
    p_orden_cat: null,
  });

  if (error) {
    return {
      error: mensajeError(error) ?? "No se ha podido crear la categoría.",
    };
  }

  revalidar();
  redirect(`/admin/categorias?creada=${String(data)}`);
}

export async function actualizarCategoria(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const id = texto(formData, "id");
  if (!id) return { error: "No se ha identificado la categoría." };

  const nombre = texto(formData, "nombre");
  if (!nombre) return { error: "El nombre de la categoría es obligatorio." };

  const { error } = await ctx.supabase.rpc("admin_categoria_update", {
    p_id: id,
    p_nombre: nombre,
    // Solo se reescribe si viene informado, por el mismo motivo que en
    // productos: el slug es la URL pública.
    p_slug: texto(formData, "slug") || null,
    p_parent_id: texto(formData, "parent_id") || null,
    p_descripcion: texto(formData, "descripcion") || null,
    p_image_url: texto(formData, "image_url") || null,
    p_orden_cat: null,
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido guardar." };
  }

  revalidar();
  revalidatePath(`/admin/categorias/${id}`);
  return { success: "Categoría guardada." };
}

/**
 * Elimina una categoría.
 *
 * La RPC no hace cascada: si tiene productos o subcategorías, rechaza y dice
 * cuántos hay. El panel deja que la persona decida antes de reasignar, porque
 * borrar un categoría con 40 productos sería una pérdida de datos.
 */
export async function eliminarCategoria(id: string): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase.rpc("admin_categoria_delete", {
    p_id: id,
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido eliminar." };
  }

  revalidar();
  return { success: "Categoría eliminada." };
}

/**
 * Mueve una categoría una posición arriba o abajo dentro de su nivel.
 *
 * La RPC intercambia `orden_cat` con la hermana contigua. Que esté en el
 * extremo no es un error: simplemente no hay con quién intercambiar.
 */
export async function moverCategoria(
  id: string,
  movimiento: number,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase.rpc("admin_categoria_reordenar", {
    p_id: id,
    p_movimiento: movimiento,
  });

  if (error) return { error: mensajeError(error) ?? "No se ha podido mover." };

  revalidar();
  return { success: "Orden actualizado." };
}
