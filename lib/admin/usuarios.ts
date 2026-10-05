import { requireAdmin } from "@/lib/admin/auth";
import type { AdminUsuario, AdminUsuarioDetalle } from "@/lib/admin/tipos";

/**
 * Lecturas de usuarios.
 *
 * Las cuentas viven en `auth.users`, fuera del alcance del rol `authenticated`.
 * Leerlas desde el servidor con el cliente normal exigiría la `service_role`,
 * que no debe salir del backend ni aparecer en variables NEXT_PUBLIC_*. Por eso
 * todo pasa por las RPC `admin_lista_usuarios` / `admin_usuario_detalle`, que
 * son `SECURITY DEFINER` y proyectan solo los campos necesarios.
 *
 * Aviso sobre el nombre de la tabla: el código de `app/account/` usa `"profiles"`
 * (en inglés) en sus `.from()`, pero la tabla real se llama `perfiles`. Aquí se
 * usa `perfiles` a propósito.
 */

export const USUARIOS_POR_PAGINA = 25;

export async function obtenerUsuario(
  id: string,
): Promise<AdminUsuarioDetalle | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("admin_usuario_detalle", {
    p_usuario_id: id,
  });

  if (error) {
    console.error("[admin] admin_usuario_detalle:", error.message);
    return null;
  }

  return (data as AdminUsuarioDetalle | null) ?? null;
}

/**
 * La exportación de datos (art. 15 y 20 del RGPD) no vive aquí sino en la action
 * `descargarDatosUsuario` de `app/admin/usuarios/actions.ts`: devuelve el JSON
 * al cliente para que lo descargue al momento, de modo que no queda ninguna copia
 * con datos personales guardada en el servidor.
 */

export type { AdminUsuario };
