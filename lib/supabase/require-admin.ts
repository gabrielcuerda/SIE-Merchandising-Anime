import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/roles";

/**
 * Guard de servidor para páginas y Server Actions de `/admin`.
 *
 * `proxy.ts` redirige al usuario no autorizado, pero **no es una frontera de
 * seguridad**: una Server Action se puede invocar directamente por HTTP. Por eso
 * cada action vuelve a comprobar la sesión aquí.
 *
 * - Verifica la identidad con el cliente de SESIÓN (valida la cookie).
 * - Devuelve el cliente PRIVILEGIADO para leer/escribir datos.
 */
export async function requireAdmin() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminUser(user)) {
    redirect("/account");
  }

  return { user, admin: createAdminClient() };
}

/**
 * Variante de `requireAdmin` para Server Actions: en lugar de redirigir
 * (imposible dentro de un action, lanzaría un error de render), lanza un
 * `Error` que el action traduce a un mensaje de estado.
 */
export async function assertAdmin() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user) {
    throw new AdminAuthError("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  }

  if (!isAdminUser(user)) {
    throw new AdminAuthError("No tienes permisos de administrador.");
  }

  return { user, admin: createAdminClient() };
}

export class AdminAuthError extends Error {}
