"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  CubeIcon,
  FolderIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export const adminNav = [
  { href: "/admin", label: "Resumen", icon: ChartBarIcon, exact: true },
  { href: "/admin/productos", label: "Productos", icon: CubeIcon },
  { href: "/admin/categorias", label: "Categorías", icon: FolderIcon },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBagIcon },
  { href: "/admin/usuarios", label: "Usuarios", icon: UsersIcon },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div>
        <Link
          href="/admin"
          className="block text-sm font-bold tracking-wide text-neutral-900 uppercase dark:text-white"
        >
          Panel admin
        </Link>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {email}
        </p>
      </div>

      <nav aria-label="Secciones del panel">
        <ul className="flex flex-col gap-1">
          {adminNav.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white",
                  )}
                >
                  <Icon aria-hidden className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Link
          href="/"
          className="text-xs text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
