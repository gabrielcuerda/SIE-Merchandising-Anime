export const SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

const PLACEHOLDER_PATTERN =
  /TU[-_](PROYECTO|CLAVE|DOMINIO)|CHANGE_ME|CAMBIAR_?AQUI|<[^>]+>/i;

/**
 * Lectura ESTÁTICA de las variables públicas.
 *
 * Next.js sólo sustituye `process.env.NEXT_PUBLIC_X` cuando el nombre aparece
 * escrito literalmente en el código. Con un acceso dinámico (`process.env[name]`)
 * no hay sustitución y en el navegador `process.env` queda vacío: `readVar`
 * devolvía `null`, `getSupabaseEnv()` lanzaba `MissingSupabaseEnvError` al
 * evaluar el módulo y el formulario de login/registro desaparecía al hidratar.
 */
const PUBLIC_ENV: Record<
  (typeof SUPABASE_ENV_VARS)[number],
  string | undefined
> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

export class MissingSupabaseEnvError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Supabase no está configurado. Faltan o siguen siendo placeholders: ${missing.join(", ")}. ` +
        "Copia .env.example en .env.local y rellena NEXT_PUBLIC_SUPABASE_URL y " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY con los datos de tu proyecto " +
        "(Project Settings > API). Después reinicia el servidor de desarrollo.",
    );
    this.name = "MissingSupabaseEnvError";
    this.missing = missing;
  }
}

function readVar(name: (typeof SUPABASE_ENV_VARS)[number]) {
  const value = PUBLIC_ENV[name]?.trim();

  if (!value || PLACEHOLDER_PATTERN.test(value)) return null;

  return value;
}

export function isSupabaseConfigured() {
  return SUPABASE_ENV_VARS.every((name) => readVar(name) !== null);
}

export function getSupabaseEnv() {
  const values = SUPABASE_ENV_VARS.map(readVar);
  const missing = SUPABASE_ENV_VARS.filter(
    (_, index) => values[index] === null,
  );

  if (missing.length > 0) {
    throw new MissingSupabaseEnvError([...missing]);
  }

  return { url: values[0]!, key: values[1]! };
}

export function requireSupabaseEnv(): [string, string] {
  const { url, key } = getSupabaseEnv();

  return [url, key];
}
