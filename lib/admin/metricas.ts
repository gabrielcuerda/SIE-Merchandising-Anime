import { requireAdmin } from "@/lib/admin/auth";
import type { AdminMetricas, AdminUsuario } from "@/lib/admin/tipos";
import type { User } from "@supabase/supabase-js";

/**
 * Métricas del dashboard.
 *
 * Delega en la RPC `admin_metricas()` en lugar de lanzar varios `count`: el
 * panel se abre en cada visita y `next.config.ts` tiene `useCache: true`, así que
 * interesa una única lectura coherente en lugar de nueve viajes de red que
 * además podrían desincronizarse entre sí.
 *
 * `pedidos` está vacía en la base de datos, así que los contadores de pedidos
 * saldrán a 0. Eso es correcto, no un fallo: el panel enseña estados vacíos
 * honestos.
 */
export async function getMetricas(): Promise<AdminMetricas | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("admin_metricas");

  if (error) {
    // La RPC exige `app_metadata.role = 'admin'`. Si el acceso llega por
    // `ADMIN_EMAILS` y no por el claim, esto es lo que va a pasar.
    console.error("[admin] admin_metricas:", error.message);
    return null;
  }

  return data as AdminMetricas;
}

export type AdminSesion = {
  email: string | null;
  esAdminPorClaim: boolean;
  esAdminPorEnv: boolean;
};

/**
 * De dónde viene el privilegio de la sesión actual. Se muestra en el panel
 * porque `ADMIN_EMAILS` da acceso a la interfaz pero NO a las escrituras: la RPC
 * `require_admin()` solo mira el claim.
 */
export function situacionAdmin(user: User): AdminSesion {
  const email = (user.email ?? "").toLowerCase();

  const permitidos = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return {
    email: user.email ?? null,
    esAdminPorClaim: user.app_metadata?.role === "admin",
    esAdminPorEnv: email !== "" && permitidos.includes(email),
  };
}

/** Texto de aviso cuando el acceso depende solo de `ADMIN_EMAILS`. */
export function avisoPermisos(sesion: AdminSesion) {
  if (sesion.esAdminPorClaim) return null;

  return (
    "Tu cuenta entra al panel por la variable ADMIN_EMAILS, pero la base de datos " +
    "solo acepta el rol «admin» en app_metadata. Podrás ver las métricas, pero " +
    "cualquier escritura fallará con «No tienes permisos». Añade " +
    'app_metadata = {"role":"admin"} a tu usuario en Supabase Studio → ' +
    "Authentication → Users."
  );
}

/**
 * Listado de usuarios vía RPC.
 *
 * `auth.users` está fuera del alcance del rol `authenticated`: leerla desde el
 * servidor exigiría la `service_role`, que no debe salir del backend. La RPC lo
 * encapsula y proyecta solo los campos necesarios.
 */
export async function listarUsuarios(params: {
  busqueda?: string | null;
  limite?: number;
  offset?: number;
}): Promise<{ total: number; usuarios: AdminUsuario[] }> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc("admin_lista_usuarios", {
    p_busqueda: params.busqueda || null,
    p_limite: params.limite ?? 50,
    p_offset: params.offset ?? 0,
  });

  if (error) {
    console.error("[admin] admin_lista_usuarios:", error.message);
    return { total: 0, usuarios: [] };
  }

  const resultado = data as {
    total: number;
    usuarios: AdminUsuario[];
  } | null;

  return {
    total: resultado?.total ?? 0,
    usuarios: resultado?.usuarios ?? [],
  };
}
