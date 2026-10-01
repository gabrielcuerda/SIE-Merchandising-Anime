"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/app/admin/actions/productos";
import { AdminAuthError, assertAdmin } from "@/lib/supabase/require-admin";

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

/** Edita los datos de contacto y la dirección guardados en `profiles`. */
export async function updateUsuario(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { admin } = await assertAdmin();

    const id = getValue(formData, "id");
    if (!id) return { error: "El usuario no es válido." };

    const { data: perfil, error: errorLectura } = await admin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (errorLectura || !perfil) {
      return { error: "Este usuario todavía no tiene ficha de perfil." };
    }

    const { error } = await admin
      .from("profiles")
      .update({
        full_nombre: getValue(formData, "full_nombre") || null,
        telefono: getValue(formData, "telefono") || null,
        direccion_calle: getValue(formData, "direccion_calle") || null,
        direccion_ciudad: getValue(formData, "direccion_ciudad") || null,
        direccion_provincia: getValue(formData, "direccion_provincia") || null,
        direccion_codigo_postal:
          getValue(formData, "direccion_codigo_postal") || null,
        direccion_pais: getValue(formData, "direccion_pais") || "España",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { error: "No hemos podido guardar los datos del usuario." };
    }

    revalidatePath(`/admin/usuarios/${id}`);
    revalidatePath("/admin/usuarios");

    return { success: "Datos guardados correctamente." };
  } catch (error) {
    return toErrorState(error, "No hemos podido guardar el usuario.");
  }
}

/**
 * Promueve o degrada a administrador.
 *
 * Escribe en `app_metadata.role`, que es exactamente lo que comprueba
 * `isAdminUser` (`lib/supabase/roles.ts`), así que el cambio surte efecto en
 * `proxy.ts` sin necesidad de reiniciar nada.
 *
 * Se impide que un admin se quite a sí mismo el rol: un único descuido dejaría
 * la tienda sin panel de administración y sin forma de recuperar el acceso.
 */
export async function setAdminRole(
  usuarioId: string,
  hacerAdmin: boolean,
): Promise<AdminActionState> {
  try {
    const { admin, user: adminActual } = await assertAdmin();

    if (!hacerAdmin && usuarioId === adminActual.id) {
      return {
        error:
          "No puedes quitarte a ti mismo el rol de administrador. Pídele a otro admin que lo haga.",
      };
    }

    // Se lee el `app_metadata` actual y se fusiona: escribir el objeto entero
    // sin leerlo antes borraría cualquier otra clave de metadatos existente.
    const { data: actual, error: errorLectura } =
      await admin.auth.admin.getUserById(usuarioId);

    if (errorLectura || !actual?.user) {
      return { error: "No hemos podido leer el usuario." };
    }

    const appMetadata: Record<string, unknown> = {
      ...(actual.user.app_metadata ?? {}),
    };

    if (hacerAdmin) {
      appMetadata.role = "admin";
    } else {
      delete appMetadata.role;
    }

    const { data, error } = await admin.auth.admin.updateUserById(usuarioId, {
      app_metadata: appMetadata,
    });

    if (error) {
      return { error: "No hemos podido cambiar el rol del usuario." };
    }

    revalidatePath(`/admin/usuarios/${usuarioId}`);
    revalidatePath("/admin/usuarios");

    return {
      success: hacerAdmin
        ? `${data.user.email ?? "El usuario"} ya tiene acceso al panel.`
        : `${data.user.email ?? "El usuario"} ya no tiene acceso al panel.`,
    };
  } catch (error) {
    return toErrorState(error, "No hemos podido cambiar el rol del usuario.");
  }
}
