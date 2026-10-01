import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import AdminMobileNav from "@/components/admin/shell/mobile-nav";
import { AdminSidebar } from "@/components/admin/shell/sidebar";
import SignOutButton from "@/components/auth/sign-out-button";
import { requireAdmin } from "@/lib/supabase/require-admin";

/**
 * `/admin` nunca debe indexarse: contiene emails, direcciones e importes de
 * clientes. `robots.ts` ya lo bloquea para crawlers; esto cubre el resto.
 */
export const metadata: Metadata = {
  title: {
    default: "Panel de administración",
    template: "%s | Panel de administración",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Administración
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Gestiona el catálogo, los pedidos y las cuentas de la tienda.
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-4 rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <Suspense fallback={<div className="h-64 animate-pulse" />}>
              <AdminSidebar email={user.email ?? ""} />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Navegación equivalente en móvil, donde el sidebar no cabe. */}
          <Suspense fallback={null}>
            <AdminMobileNav />
          </Suspense>

          <div className="mt-4 lg:mt-0">{children}</div>
        </div>
      </div>

      <p className="mt-8 border-t border-neutral-200 pt-4 text-xs text-neutral-400 dark:border-neutral-800">
        Zona restringida. Si necesitas salir del panel,{" "}
        <Link href="/" className="underline">
          vuelve a la tienda
        </Link>
        .
      </p>
    </div>
  );
}
