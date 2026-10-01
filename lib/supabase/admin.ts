import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con la service role key: ignora Row Level Security.
 *
 * ⚠️ SOLO PARA SERVIDOR. Nunca importes este módulo desde un archivo
 * `"use client"`: la clave se incrustaría en el bundle del navegador.
 *
 * La regla de oro del panel admin es:
 *   - VERIFICAR la identidad con el cliente de sesión (`createClient` de
 *     `lib/supabase/server`), que valida la cookie contra Supabase Auth.
 *   - OPERAR con este cliente privilegiado.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);

    throw new Error(
      [
        `Faltan variables de entorno para el panel admin: ${missing.join(", ")}.`,
        "La service role key se encuentra en Supabase → Project Settings → API Keys.",
        "Añádela en Vercel → Settings → Environment Variables y vuelve a desplegar.",
      ].join(" "),
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
