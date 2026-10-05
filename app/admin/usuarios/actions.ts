"use server";

import { getAdminContext, mensajeError } from "@/lib/admin/auth";
import type { AdminActionState } from "@/lib/admin/tipos";
import { revalidatePath } from "next/cache";

function revalidar(usuarioId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  if (usuarioId) revalidatePath(`/admin/usuarios/${usuarioId}`);
  // El rol vive en `auth.users`, que la página de cuenta lee en cada visita.
  revalidatePath("/account");
}

// ============================================================================
// Rol de administrador
// ============================================================================

/**
 * Convierte una cuenta en administradora, o le quita el rol (`p_rol = null`).
 *
 * La RPC escribe en `auth.users.raw_app_meta_data`, que es el mismo claim que
 * lee `isAdminUser()` en `lib/supabase/middleware.ts`. Por eso el cambio surte
 * efecto sin tocar el código de auth.
 *
 * Dos advertencias que la RPC aplica y esta interfaz solo comunica:
 *
 * - No te puedes cambiar el rol a ti mismo: te quedarías fuera del panel sin
 *   vuelta atrás salvo por SQL manual.
 * - El cambio no afecta a la sesión actual del usuario afectado hasta que
 *   refresca: el JWT va firmado y el claim viaja en él.
 */
export async function cambiarRol(
  usuarioId: string,
  esAdmin: boolean,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  if (usuarioId === ctx.user.id) {
    return {
      error: "No puedes cambiar tu propio rol de administrador.",
    };
  }

  const { error } = await ctx.supabase.rpc("admin_usuario_establecer_rol", {
    p_usuario_id: usuarioId,
    p_rol: esAdmin ? "admin" : null,
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido cambiar el rol." };
  }

  revalidar(usuarioId);

  return {
    success: esAdmin
      ? "Rol de administrador concedido. La persona tendrá que refrescar su sesión para que surta efecto."
      : "Rol de administrador retirado.",
  };
}

// ============================================================================
// Bloqueo de cuenta
// ============================================================================

/**
 * Bloquea o desbloquea una cuenta.
 *
 * GoTrue considera una cuenta bloqueada si `banned_until > now()`, así que
 * "permanente" se implementa con una fecha muy lejana.
 */
export async function bloquearUsuario(
  usuarioId: string,
  bloquear: boolean,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  if (usuarioId === ctx.user.id) {
    return { error: "No puedes bloquear tu propia cuenta." };
  }

  const { error } = await ctx.supabase.rpc("admin_usuario_bloquear", {
    p_usuario_id: usuarioId,
    p_bloquear: bloquear,
  });

  if (error) {
    return {
      error: mensajeError(error) ?? "No se ha podido cambiar la cuenta.",
    };
  }

  revalidar(usuarioId);
  return { success: bloquear ? "Cuenta bloqueada." : "Cuenta desbloqueada." };
}

// ============================================================================
// Derechos del interesado
// ============================================================================

/**
 * Derecho de supresión (art. 17 del RGPD).
 *
 * NO borra la fila de `auth.users`. Si `pedidos.usuario_id` estuviera declarado
 * `ON DELETE CASCADE`, borrar la cuenta arrastraría el histórico de ventas, y
 * perder facturas es peor que conservar un identificador. Lo que hace es
 * anonimizar: borra perfil, lista de deseos y carrito, sustituye el email por
 * uno del dominio reservado `.invalid` y bloquea la cuenta.
 *
 * `pedidos` se conserva por la obligación legal de conservar los datos de
 * facturación, que es la excepción que declara la política de privacidad.
 */
export async function eliminarDatosUsuario(
  usuarioId: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  if (usuarioId === ctx.user.id) {
    return { error: "No puedes eliminar tu propia cuenta desde el panel." };
  }

  const { error } = await ctx.supabase.rpc("admin_usuario_eliminar", {
    p_usuario_id: usuarioId,
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido completar." };
  }

  revalidar(usuarioId);

  return {
    success:
      "Datos personales eliminados y cuenta anonimizada. El historial de " +
      "pedidos se conserva por obligación de facturación.",
  };
}

/**
 * Descarga la exportación de datos.
 *
 * Devuelve el JSON al cliente para que lo descargue. No se guarda en ningún
 * sitio: un fichero con datos personales en el servidor sería un nuevo problema
 * que resolver.
 */
export async function descargarDatosUsuario(
  usuarioId: string,
): Promise<
  AdminActionState & { archivo?: { nombre: string; contenido: string } }
> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { data, error } = await ctx.supabase.rpc("admin_usuario_exportar", {
    p_usuario_id: usuarioId,
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido exportar." };
  }

  return {
    success: "Exportación generada. Revisa el archivo antes de compartirlo.",
    archivo: {
      nombre: `datos-${usuarioId.slice(0, 8)}.json`,
      contenido: JSON.stringify(data, null, 2),
    },
  };
}
