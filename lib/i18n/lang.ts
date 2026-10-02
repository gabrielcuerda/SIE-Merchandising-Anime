import { cookies } from "next/headers";
import { DEFAULT_LANG, type Lang } from "./dict";

/**
 * Lee el idioma desde la cookie (SÓLO en componentes de servidor).
 * Los de cliente usan `useLanguage()` de components/i18n/language-context.
 */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("lang")?.value === "en" ? "en" : DEFAULT_LANG;
}