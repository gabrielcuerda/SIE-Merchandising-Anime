export const SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

const PLACEHOLDER_PATTERN =
  /TU[-_](PROYECTO|CLAVE|DOMINIO)|CHANGE_ME|CAMBIAR_?AQUI|<[^>]+>/i;

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

function readVar(name: string) {
  const value = process.env[name]?.trim();

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
