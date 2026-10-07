"use client";

import { LANGS, type Lang } from "@/lib/i18n/dict";
import { useLanguage } from "./language-context";

const LABELS: Record<Lang, string> = { es: "ES", en: "EN" };

export default function LangToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Cambiar idioma / Change language"
      className="flex h-10 items-center rounded-md border border-blue-500 bg-blue-900 p-0.5"
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`h-full rounded-sm px-2.5 text-xs font-bold uppercase transition ${
            lang === l
              ? "bg-ki-500 text-ink-950"
              : "text-blue-100 hover:text-ki-400"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
