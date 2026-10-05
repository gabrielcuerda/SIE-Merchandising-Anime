"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { NavCategoria } from "@/lib/navigation";
import { getMainNav } from "@/lib/site";
import { translate } from "@/lib/i18n/dict";
import { useLanguage } from "components/i18n/language-context";
import Link from "next/link";

export default function CategoryNav({
  categorias,
}: {
  categorias: NavCategoria[];
}) {
  const { lang } = useLanguage();
  return (
    // `contents` mete el popover y la lista en la fila del header en lugar de
    // crear una caja propia, para que el desplegable siga midiendo el ancho
    // completo de la barra.
    <nav
      aria-label={translate(lang, "nav.ariaCategories")}
      className="hidden lg:contents"
    >
      <Popover className="flex self-stretch">
        {({ open, close }) => (
          <>
            <PopoverButton
              className={clsx(
                "flex items-center gap-2 px-2 text-sm font-extrabold tracking-[0.12em] uppercase transition",
                open ? "text-brand-600" : "text-ink-950 hover:text-brand-600",
              )}
            >
              <BarsIcon />
              {translate(lang, "nav.allCategories")}
              <ChevronDownIcon
                className={clsx(
                  "h-3 w-3 transition-transform motion-reduce:transition-none",
                  open && "rotate-180",
                )}
                aria-hidden="true"
              />
            </PopoverButton>

            <PopoverPanel
              transition
              className="absolute inset-x-0 top-full z-50 origin-top border-t border-ink-200 bg-white text-ink-950 shadow-float transition duration-200 ease-out data-closed:translate-y-2 data-closed:opacity-0 motion-reduce:transition-none"
            >
              {categorias.length ? (
                <>
                  <div className="page-container flex items-end justify-between gap-6 pt-6">
                    <div className="flex items-center gap-2.5">
                      <Squares2X2Icon
                        className="h-5 w-5 shrink-0 text-brand-500"
                        aria-hidden="true"
                      />
                      <div>
                        <h2 className="text-xs font-extrabold tracking-[0.2em] text-ink-950 uppercase">
                          {translate(lang, "nav.allCategories")}
                        </h2>
                        <p className="mt-0.5 text-sm text-ink-500">
                          {translate(lang, "nav.categoriesSubtitle")}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/search"
                      onClick={close}
                      className="inline-flex shrink-0 items-center gap-1.5 pb-0.5 text-sm font-bold text-brand-600 transition hover:text-brand-700 hover:underline"
                    >
                      {translate(lang, "nav.viewFullCatalog")}
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>

                  <ul className="page-container grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categorias.map((categoria) => (
                      <li key={categoria.id}>
                        <Link
                          href={`/search/${categoria.slug}`}
                          onClick={close}
                          className="group/cat flex items-center justify-between gap-3 rounded-card border border-ink-200 bg-white p-4 transition duration-200 hover:border-brand-400 hover:bg-brand-50 hover:shadow-card motion-reduce:transition-none"
                        >
                          <span className="text-sm font-extrabold tracking-wide text-ink-950 uppercase transition group-hover/cat:text-brand-700">
                            {categoria.nombre}
                          </span>
                          <ChevronRightIcon
                            className="h-4 w-4 shrink-0 text-ink-300 transition group-hover/cat:translate-x-0.5 group-hover/cat:text-brand-500 motion-reduce:transition-none"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="page-container flex flex-col items-center gap-3 py-12 text-center">
                  <Squares2X2Icon
                    className="h-8 w-8 text-ink-300"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-ink-500">
                    {translate(lang, "nav.noCategories")}
                  </p>
                  <Link
                    href="/search"
                    onClick={close}
                    className="text-sm font-bold text-brand-600 hover:underline"
                  >
                    {translate(lang, "nav.browseCatalog")}
                  </Link>
                </div>
              )}
            </PopoverPanel>
          </>
        )}
      </Popover>

      <ul className="flex self-stretch items-stretch">
        {[
          { label: translate(lang, "nav.homeLink"), href: "/" },
          ...getMainNav(lang),
        ].map((item) => (
          <li key={item.href} className="flex">
            <Link
              href={item.href}
              className="flex items-center px-2.5 text-sm font-extrabold tracking-[0.12em] text-ink-950 uppercase transition hover:bg-ink-50 hover:text-brand-600"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
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
