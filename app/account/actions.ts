"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AccountActionState = {
  success?: string;
  error?: string;
};

function getValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfile(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const fullNombre = getValue(formData, "full_nombre");
  const telefono = getValue(formData, "telefono");

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_nombre: fullNombre || null,
      telefono: telefono || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: "No hemos podido guardar tu perfil." };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");

  return { success: "Perfil actualizado correctamente." };
}

export async function updateAddress(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      direccion_calle: getValue(formData, "direccion_calle") || null,
      direccion_ciudad: getValue(formData, "direccion_ciudad") || null,
      direccion_provincia: getValue(formData, "direccion_provincia") || null,
      direccion_codigo_postal:
        getValue(formData, "direccion_codigo_postal") || null,
      direccion_pais: getValue(formData, "direccion_pais") || "España",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: "No hemos podido guardar tu dirección." };
  }

  revalidatePath("/account");
  revalidatePath("/account/addresses");

  return { success: "Dirección guardada correctamente." };
}
