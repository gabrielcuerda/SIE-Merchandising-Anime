"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { translate } from "@/lib/i18n/dict";
import { useLanguage } from "@/components/i18n/language-context";

export default function Search({
  className = "",
  autoFocus = false,
}: {
  className?: string;
  autoFocus?: boolean;
}) {
  const searchParams = useSearchParams();
  const value = searchParams?.get("q") ?? "";
  const { lang } = useLanguage();

  return (
    <Form
      action="/search"
      role="search"
      className={`relative w-full ${className}`}
    >
      <label htmlFor="site-search" className="sr-only">
        {translate(lang, "search.label")}
      </label>
      <input
        id="site-search"
        key={value}
        type="search"
        name="q"
        placeholder={translate(lang, "search.placeholder")}
        autoComplete="off"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        defaultValue={value}
        className="w-full rounded-md border border-ink-200 bg-white py-2.5 pr-12 pl-4 text-sm text-ink-950 transition placeholder:text-ink-400 focus:border-ki-400 focus:bg-white focus:outline-hidden"
      />
      <button
        type="submit"
        aria-label={translate(lang, "search.submit")}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm bg-ki-500 text-ink-950 transition hover:bg-blue-900 hover:text-white"
      >
        <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </Form>
  );
}

export function SearchSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full ${className}`} aria-hidden="true">
      <div className="w-full animate-pulse rounded-md border border-ink-200 bg-white py-2.5 pr-12 pl-4 text-sm" />
      <div className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 animate-pulse rounded-sm bg-ki-200" />
    </div>
  );
}
