import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/middleware";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type ServerClient = SupabaseClient;

/**
 * Guard de administración para Server Components.
 *
 * `proxy.ts` ya protege `/admin` por navegación HTTP, pero ese guard NO cubre
 * las Server Actions: un POST directo a una action la ejecutaría sin pasar por
 * él. Por eso el layout también revalida.
 *
 * `isAdminUser` es la única fuente de verdad del rol. No la reimplementes.
 */
export async function requireAdmin(): Promise<{
  supabase: ServerClient;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminUser(user)) {
    // Mismo destino que `proxy.ts`: fuera del panel, pero con la sesión viva.
    redirect("/account");
  }

  return { supabase, user };
}

/**
 * Variante para Server Actions: en vez de redirigir, devuelve un mensaje de
 * error. Un `redirect()` dentro de una action deja al usuario sin explicación
 * de por qué no se guardó nada.
 */
export async function getAdminContext(): Promise<
  | { ok: true; supabase: ServerClient; user: User }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
    };
  }

  if (!isAdminUser(user)) {
    return { ok: false, error: "No tienes permisos para acceder al panel." };
  }

  return { ok: true, supabase, user };
}

/**
 * Traduce el error de una RPC a un mensaje legible.
 *
 * `require_admin()` lanza con errcode 42501 (insufficient_privilege); el resto
 * son validaciones de dominio que ya llegan en español desde SQL. Lo único que
 * hay que descartar son los sufijos técnicos que PostgREST añade detrás.
 */
export function mensajeError(
  error: { code?: string; message: string } | null | undefined,
) {
  if (!error) return null;

  if (error.code === "42501") {
    return "No tienes permisos para realizar esta operación.";
  }

  const limpio = error.message.split("\n")[0]?.trim() ?? error.message;
  return limpio.replace(/\s+/g, " ");
}
