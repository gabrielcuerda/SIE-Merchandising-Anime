"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { TruckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { NavCategoria } from "@/lib/navigation";
import { mainNav, siteConfig } from "@/lib/site";
import Link from "next/link";

export default function CategoryNav({
  categorias,
}: {
  categorias: NavCategoria[];
}) {
  return (
    <nav
      aria-label="Categorías y navegación principal"
      className="hidden bg-ink-950 text-white lg:block"
    >
      <div className="page-container flex h-12 items-stretch">
        <Popover className="relative flex">
          {({ open, close }) => (
            <>
              <PopoverButton
                className={clsx(
                  "flex items-center gap-2 pr-6 text-sm font-extrabold tracking-[0.12em] uppercase transition",
                  open ? "text-brand-400" : "hover:text-brand-400",
                )}
              >
                <BarsIcon />
                Todas las categorías
                <ChevronDownIcon
                  className={clsx(
                    "h-3 w-3 transition-transform",
                    open && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </PopoverButton>

              <PopoverPanel
                anchor={{ to: "bottom start", gap: 8 }}
                transition
                className="z-50 w-[min(46rem,90vw)] origin-top rounded-b-card border border-t-0 border-ink-200 bg-white p-6 text-ink-950 shadow-float transition duration-150 ease-out data-closed:translate-y-1 data-closed:opacity-0"
              >
                {categorias.length ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
                    {categorias.map((categoria) => (
                      <div key={categoria.id}>
                        <Link
                          href={`/search/${categoria.slug}`}
                          onClick={close}
                          className="block border-b border-ink-100 pb-2 text-sm font-extrabold tracking-wide text-ink-950 uppercase transition hover:text-brand-600"
                        >
                          {categoria.nombre}
                        </Link>
                        {categoria.hijas.length ? (
                          <ul className="mt-2 space-y-1.5">
                            {categoria.hijas.map((hija) => (
                              <li key={hija.id}>
                                <Link
                                  href={`/search/${hija.slug}`}
                                  onClick={close}
                                  className="text-sm text-ink-500 transition hover:text-brand-600"
                                >
                                  {hija.nombre}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-500">
                    Estamos cargando las categorías. Mientras tanto,{" "}
                    <Link
                      href="/search"
                      onClick={close}
                      className="font-bold text-brand-600 hover:underline"
                    >
                      mira todo el catálogo
                    </Link>
                    .
                  </p>
                )}

                <div className="mt-6 border-t border-ink-100 pt-4">
                  <Link
                    href="/search"
                    onClick={close}
                    className="text-sm font-bold tracking-wide text-brand-600 uppercase hover:underline"
                  >
                    Ver el catálogo completo →
                  </Link>
                </div>
              </PopoverPanel>
            </>
          )}
        </Popover>

        <ul className="flex items-stretch">
          {[{ label: "Inicio", href: "/" }, ...mainNav].map((item) => (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                className="flex items-center px-4 text-sm font-extrabold tracking-[0.12em] text-white/90 uppercase transition hover:bg-ink-800 hover:text-brand-400"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/envios"
          className="ml-auto flex items-center gap-2 pl-4 text-xs font-bold tracking-[0.1em] text-ink-300 uppercase transition hover:text-brand-400"
        >
          <TruckIcon className="h-4 w-4 text-brand-400" aria-hidden="true" />
          {siteConfig.freeShippingLabel} desde{" "}
          {siteConfig.freeShippingThreshold} €
        </Link>
      </div>
    </nav>
  );
}

function BarsIcon() {
  return (
    <span aria-hidden="true" className="flex flex-col gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="block h-[2px] w-4 rounded-full bg-current" />
      ))}
    </span>
  );
}
