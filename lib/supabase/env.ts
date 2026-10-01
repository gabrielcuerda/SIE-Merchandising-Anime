export function requireSupabaseEnv(): [string, string] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !key ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
    ].filter(Boolean);

    throw new Error(
      [
        `Faltan variables de entorno de Supabase: ${missing.join(", ")}.`,
        "Añádelas en Vercel → Settings → Environment Variables",
        "(entornos Production y Preview) y vuelve a desplegar.",
      ].join(" "),
    );
  }

  return [url, key];
}
