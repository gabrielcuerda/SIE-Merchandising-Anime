import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import Paginacion from "@/components/admin/paginacion";
import UsuarioFiltros from "@/components/admin/usuario-filtros";
import { Card, CardContent } from "@/components/ui";
import { requireAdmin } from "@/lib/admin/auth";
import {
  enmascararEmail,
  fecha,
  importe,
  iniciales,
  numero,
} from "@/lib/admin/formato";
import { listarUsuarios } from "@/lib/admin/metricas";
import { USUARIOS_POR_PAGINA } from "@/lib/admin/usuarios";
import { Badge } from "@/components/ui";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

/**
 * Listado de usuarios.
 *
 * Los emails se enseñan ENMASCARADOS por defecto. Son dato personal y el
 * listado se usa mucho más que el detalle; el toggle para verlos reales es una
 * decisión deliberada, no un descuido.
 *
 * `perfiles` se crea de forma perezosa, así que un usuario recién registrado
 * puede no tener nombre ni teléfono. La RPC lo resuelve con LEFT JOIN y aquí se
 * muestra el email como referencia.
 */
export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const una = (clave: string) => {
    const valor = params[clave];
    return Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
  };

  const busqueda = una("q") || null;
  const pagina = Math.max(Number.parseInt(una("pagina"), 10) || 1, 1);
  const porPagina = USUARIOS_POR_PAGINA;
  const offset = (pagina - 1) * porPagina;

  const { user } = await requireAdmin();

  const { total, usuarios } = await listarUsuarios({
    busqueda,
    limite: porPagina,
    offset,
  });

  const paginas = Math.max(Math.ceil(total / porPagina), 1);

  return (
    <AdminPage
      eyebrow="Cuentas"
      titulo="Usuarios"
      descripcion={`${numero(total)} ${total === 1 ? "cuenta" : "cuentas"} registradas.`}
    >
      <Suspense fallback={null}>
        <UsuarioFiltros />
      </Suspense>

      {usuarios.length === 0 ? (
        <AdminVacio
          titulo={
            busqueda ? "Ninguna cuenta coincide" : "Todavía no hay usuarios"
          }
          descripcion={
            busqueda
              ? "Prueba con otro email o nombre."
              : "No hay ninguna cuenta registrada. Se crean cuando alguien se registra en la tienda, no desde el panel."
          }
        />
      ) : (
        <>
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-200">
                      {[
                        "Cuenta",
                        "Alta",
                        "Último acceso",
                        "Pedidos",
                        "Gastado",
                        "Estado",
                        "",
                      ].map((columna) => (
                        <th
                          key={columna}
                          scope="col"
                          className="px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-500"
                        >
                          {columna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600"
                            >
                              {iniciales(usuario.nombre, usuario.email)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink-900">
                                {usuario.nombre ?? "Sin nombre"}
                              </p>
                              <p
                                className="truncate font-mono text-xs text-ink-500"
                                title="Los emails se ocultan en el listado por defecto"
                              >
                                {enmascararEmail(usuario.email)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-ink-700">
                          {fecha(usuario.created_at)}
                        </td>

                        <td className="px-3 py-2.5 text-ink-700">
                          {fecha(usuario.last_sign_in_at)}
                        </td>

                        <td className="px-3 py-2.5 tabular-nums text-ink-700">
                          {usuario.pedidos}
                        </td>

                        <td className="px-3 py-2.5 font-medium text-ink-900">
                          {importe(usuario.total_gastado)}
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {usuario.es_admin ? (
                              <Badge tone="brand" size="sm">
                                Admin
                              </Badge>
                            ) : null}
                            {usuario.bloqueado ? (
                              <Badge tone="alert" size="sm">
                                Bloqueada
                              </Badge>
                            ) : null}
                            {!usuario.email_confirmed_at ? (
                              <Badge tone="warning" size="sm">
                                Sin confirmar
                              </Badge>
                            ) : null}
                            {usuario.id === user.id ? (
                              <Badge tone="neutral" size="sm">
                                Tú
                              </Badge>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <Link
                            href={`/admin/usuarios/${usuario.id}`}
                            className="rounded-card px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100"
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Suspense fallback={null}>
            <Paginacion
              pagina={pagina}
              paginas={paginas}
              total={total}
              porPagina={porPagina}
            />
          </Suspense>
        </>
      )}
    </AdminPage>
  );
}
