import AdminNav from "@/components/admin/admin-nav";
import { AdminPanelBody } from "@/components/admin/admin-page";
import SignOutButton from "@/components/auth/sign-out-button";
import { AlertBanner } from "@/components/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { avisoPermisos, situacionAdmin } from "@/lib/admin/metricas";
import Link from "next/link";

/**
 * Layout del panel de administración.
 *
 * `proxy.ts` ya redirige a `/login?next=...` si no hay sesión y a `/account` si
 * no hay permiso. Este re-chequeo no es redundante: el guard de `proxy.ts` solo
 * actúa sobre navegación HTTP y no protege las Server Actions. Es la primera
 * capa de la defensa en profundidad, no la única.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  const sesion = situacionAdmin(user);
  const aviso = avisoPermisos(sesion);

  return (
    <div className="page-container py-10">
      <div className="mb-8 flex flex-col gap-4 border-b border-ink-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Administración</p>
          <p className="text-sm text-ink-500">
            {sesion.email ?? "Sesión de administrador"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-950"
          >
            Ver la tienda
          </Link>
          <SignOutButton />
        </div>
      </div>

      {aviso ? (
        <div className="mb-6">
          <AlertBanner tone="warning">{aviso}</AlertBanner>
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row">
        <AdminNav />
        <AdminPanelBody>{children}</AdminPanelBody>
      </div>
    </div>
  );
}
