"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import { useSearchParams } from "next/navigation";

export default function Search({
  className = "",
  autoFocus = false,
}: {
  className?: string;
  autoFocus?: boolean;
}) {
  const searchParams = useSearchParams();
  const value = searchParams?.get("q") ?? "";

  return (
    <Form
      action="/search"
      role="search"
      className={`relative w-full ${className}`}
    >
      <label htmlFor="site-search" className="sr-only">
        Buscar productos
      </label>
      <input
        id="site-search"
        key={value}
        type="search"
        name="q"
        placeholder="Busca figuras, manga, apparel..."
        autoComplete="off"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        defaultValue={value}
        className="w-full rounded-md border border-ink-200 bg-ink-50 py-2.5 pr-12 pl-4 text-sm text-ink-950 transition placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-hidden"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm bg-ink-950 text-white transition hover:bg-brand-500"
      >
        <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </Form>
  );
}

export function SearchSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full ${className}`} aria-hidden="true">
      <div className="w-full animate-pulse rounded-md border border-ink-200 bg-ink-50 py-2.5 pr-12 pl-4 text-sm" />
      <div className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 animate-pulse rounded-sm bg-ink-200" />
    </div>
  );
}
