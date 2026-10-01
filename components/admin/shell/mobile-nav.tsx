"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { adminNav } from "@/components/admin/shell/sidebar";

/** Sustituye al sidebar en viewports estrechos. */
export default function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones del panel"
      className="-mx-4 overflow-x-auto border-b border-neutral-200 px-4 lg:hidden dark:border-neutral-800"
    >
      <ul className="flex w-max min-w-full gap-1 pb-2">
        {adminNav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition",
                  active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900",
                )}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
