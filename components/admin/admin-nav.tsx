"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/usuarios", label: "Usuarios" },
] as const;

/**
 * Navegación del panel.
 *
 * Deliberadamente distinta del `Navbar` del catálogo: aquel incluye el menú
 * público de categorías, el buscador y el carrito, que en administración solo
 * distraen.
 *
 * Es un Client Component porque el enlace activo sale de `usePathname()`.
 * Highlight para `/admin` es exacto (si no, "Resumen" se marcaría también en
 * cualquier subruta) y para el resto es por prefijo.
 */
export default function AdminNav() {
  const pathname = usePathname() ?? "/admin";

  const esActivo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navegación del panel de administración"
      className="-mx-4 flex gap-1 overflow-x-auto border-b border-ink-200 px-4 pb-px lg:mx-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:px-0 lg:pb-0 lg:pr-6"
    >
      {ADMIN_LINKS.map((link) => {
        const activo = esActivo(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={activo ? "page" : undefined}
            className={
              activo
                ? "shrink-0 whitespace-nowrap rounded-card bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700"
                : "shrink-0 whitespace-nowrap rounded-card px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
