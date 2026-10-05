"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Suspense, useState } from "react";
import Search, { SearchSkeleton } from "./search";

export default function MobileSearch({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Cerrar búsqueda" : "Buscar productos"}
        aria-expanded={open}
        className={`flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-950 transition hover:border-brand-500 hover:text-brand-600 ${className}`}
      >
        {open ? (
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-50 border-b border-ink-200 bg-white px-4 py-3 shadow-card">
          <Suspense fallback={<SearchSkeleton />}>
            <Search autoFocus />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
