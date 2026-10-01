"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { NavCategoria } from "@/lib/navigation";
import { mainNav } from "@/lib/site";
import Link from "next/link";
import { useEffect, useState } from "react";
import Search from "./search";

const accountLinks = [
  { label: "Mi cuenta", href: "/account" },
  { label: "Mis pedidos", href: "/account/orders" },
  { label: "Mi lista de deseos", href: "/wishlist" },
  { label: "Iniciar sesión", href: "/login" },
];

export default function MobileMenu({
  categorias,
}: {
  categorias: NavCategoria[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
        aria-label="Abrir menú"
        aria-expanded={isOpen}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-950 transition hover:border-brand-500 hover:text-brand-600 lg:hidden"
      >
        <Bars3Icon className="h-5 w-5" aria-hidden="true" />
      </button>

      <Dialog open={isOpen} onClose={close} className="relative z-50 lg:hidden">
        <div
          className="fixed inset-0 bg-ink-950/60 transition-opacity duration-300 ease-out data-closed:opacity-0"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-ink-950 text-white transition duration-300 ease-out data-closed:-translate-x-full"
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
              <DialogTitle className="text-sm font-extrabold tracking-[0.18em] uppercase">
                Menú
              </DialogTitle>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-800 transition hover:border-brand-500 hover:text-brand-400"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-4 py-4">
              <Search />
            </div>

            <nav aria-label="Menú móvil" className="flex-1 px-4 pb-8">
              {categorias.length ? (
                <ul className="border-b border-ink-800 pb-4">
                  {categorias.map((categoria) => {
                    const isExpanded = expanded === categoria.id;

                    return (
                      <li key={categoria.id}>
                        <div className="flex items-center">
                          <Link
                            href={`/search/${categoria.slug}`}
                            onClick={close}
                            className="flex-1 py-3 text-base font-bold transition hover:text-brand-400"
                          >
                            {categoria.nombre}
                          </Link>
                          {categoria.hijas.length ? (
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              aria-label={`Ver subcategorías de ${categoria.nombre}`}
                              onClick={() =>
                                setExpanded(isExpanded ? null : categoria.id)
                              }
                              className={clsx(
                                "flex h-9 w-9 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-800 hover:text-brand-400",
                                isExpanded && "rotate-45 text-brand-400",
                              )}
                            >
                              <PlusIcon />
                            </button>
                          ) : null}
                        </div>

                        {isExpanded ? (
                          <ul className="mb-2 ml-4 border-l border-ink-800 pl-4">
                            {categoria.hijas.map((hija) => (
                              <li key={hija.id}>
                                <Link
                                  href={`/search/${hija.slug}`}
                                  onClick={close}
                                  className="block py-2 text-sm text-ink-300 transition hover:text-brand-400"
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

              <ul className="border-b border-ink-800 py-4">
                {[{ label: "Inicio", href: "/" }, ...mainNav].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block py-3 text-base font-bold transition hover:text-brand-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <ul className="py-4">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="block py-3 text-sm text-ink-300 transition hover:text-brand-400"
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
