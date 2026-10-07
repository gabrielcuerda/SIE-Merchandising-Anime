"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { NavCategoria } from "@/lib/navigation";
import { getMainNav } from "@/lib/site";
import { translate, type Lang } from "@/lib/i18n/dict";
import { useLanguage } from "components/i18n/language-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import Search from "./search";

function getAccountLinks(lang: Lang) {
  return [
    { label: translate(lang, "account.myAccount"), href: "/account" },
    { label: translate(lang, "account.orders"), href: "/account/orders" },
    { label: translate(lang, "account.wishlist"), href: "/wishlist" },
    { label: translate(lang, "account.signIn"), href: "/login" },
  ];
}

export default function MobileMenu({
  categorias,
}: {
  categorias: NavCategoria[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { lang } = useLanguage();
  const close = () => setIsOpen(false);

  // Bloquea el scroll del body mientras el menú está abierto
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={translate(lang, "menu.open")}
        aria-expanded={isOpen}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-500 text-ki-400 transition hover:border-ki-400 hover:text-white lg:hidden"
      >
        <Bars3Icon className="h-5 w-5" aria-hidden="true" />
      </button>

      <Dialog open={isOpen} onClose={close} className="relative z-50 lg:hidden">
        <div
          className="fixed inset-0 bg-blue-950/60 transition-opacity duration-300 ease-out data-closed:opacity-0"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-blue-950 text-white transition duration-300 ease-out data-closed:-translate-x-full"
          >
            <div className="flex items-center justify-between border-b border-blue-900 px-4 py-3">
              <DialogTitle className="text-sm font-extrabold tracking-[0.18em] uppercase">
                {translate(lang, "menu.title")}
              </DialogTitle>
              <button
                type="button"
                onClick={close}
                aria-label={translate(lang, "menu.close")}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-900 transition hover:border-ki-400 hover:text-ki-400"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-4 py-4">
              <Search />
            </div>

            <nav
              aria-label={translate(lang, "menu.ariaMobile")}
              className="flex-1 px-4 pb-8"
            >
              {categorias.length ? (
                <ul className="border-b border-blue-900 pb-4">
                  {categorias.map((categoria) => {
                    const isExpanded = expanded === categoria.id;

                    return (
                      <li key={categoria.id}>
                        <div className="flex items-center">
                          <Link
                            href={`/search/${categoria.slug}`}
                            onClick={close}
                            className="flex-1 py-3 text-base font-bold transition hover:text-ki-400"
                          >
                            {categoria.nombre}
                          </Link>
                          {categoria.hijas.length ? (
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={`${translate(lang, "menu.viewSubcategories")} ${categoria.nombre}`}
                              onClick={() =>
                                setExpanded(isExpanded ? null : categoria.id)
                              }
                              className={clsx(
                                "flex h-9 w-9 items-center justify-center rounded-md text-ink-300 transition hover:bg-blue-900 hover:text-ki-400",
                                isExpanded && "rotate-45 text-ki-400",
                              )}
                            >
                              <PlusIcon />
                            </button>
                          ) : null}
                        </div>

                        {isExpanded ? (
                          <ul className="mb-2 ml-4 border-l border-blue-900 pl-4">
                            {categoria.hijas.map((hija) => (
                              <li key={hija.id}>
                                <Link
                                  href={`/search/${hija.slug}`}
                                  onClick={close}
                                  className="block py-2 text-sm text-ink-300 transition hover:text-ki-400"
                                >
                                  {hija.nombre}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <ul className="border-b border-blue-900 py-4">
                {[
                  { label: translate(lang, "nav.homeLink"), href: "/" },
                  ...getMainNav(lang),
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block py-3 text-base font-bold transition hover:text-ki-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <ul className="py-4">
                {getAccountLinks(lang).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block py-3 text-sm text-ink-300 transition hover:text-ki-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 transition-transform duration-200"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  );
}
