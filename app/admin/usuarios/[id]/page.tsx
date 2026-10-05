import Link from "next/link";
import { AdminPage, AdminVacio } from "@/components/admin/admin-page";
import UsuarioAcciones from "@/components/admin/usuario-acciones";
import { Seccion } from "@/components/admin/campos";
import {
  AlertBanner,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { obtenerUsuario } from "@/lib/admin/usuarios";
import { fecha, fechaYhora, idCorto, importe } from "@/lib/admin/formato";
import {
  PEDIDO_STATUS_LABEL,
  PEDIDO_STATUS_TONE,
  type PedidoStatus,
} from "@/lib/admin/tipos";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Detalle de una cuenta.
 *
 * Aquí sí se ven los datos personales completos, incluido el email: es la
 * pantalla donde se gestiona la cuenta y hace falta identificarla. El listado es
 * quien los enmascara.
 */
export default async function DetalleUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ user }, usuario] = await Promise.all([
    requireAdmin(),
    obtenerUsuario(id),
  ]);

  if (!usuario) notFound();

  const soyYo = usuario.id === user.id;
  const perfil = usuario.perfil;

  const direccion = [
    perfil?.direccion_calle,
    [perfil?.direccion_codigo_postal, perfil?.direccion_ciudad]
      .filter(Boolean)
      .join(" "),
    [perfil?.direccion_provincia, perfil?.direccion_pais]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <AdminPage
      eyebrow="Cuentas"
      titulo={perfil?.full_nombre ?? usuario.email ?? "Usuario"}
      descripcion={`Alta ${fecha(usuario.created_at)} · ${usuario.email ?? "sin email"}`}
      acciones={
        <div className="flex gap-2">
          {usuario.es_admin ? (
            <Badge tone="brand" size="lg">
              Administrador
            </Badge>
          ) : null}
          {usuario.bloqueado ? (
            <Badge tone="alert" size="lg">
              Bloqueada
            </Badge>
          ) : null}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
        <div>
          <Seccion titulo="Datos de la cuenta">
            <Card>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <Dato termino="Email" valor={usuario.email ?? "—"} mono />
                  <Dato
                    termino="Nombre"
                    valor={perfil?.full_nombre ?? "Sin nombre"}
                  />
                  <Dato termino="Teléfono" valor={perfil?.telefono ?? "—"} />
                  <Dato
                    termino="Email confirmado"
                    valor={
                      usuario.email_confirmed_at
                        ? fecha(usuario.email_confirmed_at)
                        : "Sin confirmar"
                    }
                  />
                  <Dato
                    termino="Registrado"
                    valor={fechaYhora(usuario.created_at)}
                  />
                  <Dato
                    termino="Último acceso"
                    valor={
                      usuario.last_sign_in_at
                        ? fechaYhora(usuario.last_sign_in_at)
                        : "Nunca ha entrado"
                    }
                  />
                  <Dato termino="Identificador" valor={usuario.id} mono />
                </dl>
              </CardContent>
            </Card>
          </Seccion>

          <Seccion titulo="Dirección guardada">
            <Card>
              <CardContent>
                {direccion ? (
                  <address className="text-sm not-italic leading-relaxed text-ink-700">
                    {direccion}
                  </address>
                ) : (
                  <p className="text-sm text-ink-400">
                    Esta cuenta no tiene ninguna dirección guardada. Se rellena
                    en «Mi cuenta → Direcciones» o en cada pedido.
                  </p>
                )}
              </CardContent>
            </Card>
          </Seccion>

          <Seccion
            titulo="Pedidos"
            descripcion="Historial de compras de esta cuenta."
          >
            {usuario.pedidos.length === 0 ? (
              <AdminVacio
                titulo="Sin pedidos"
                descripcion="Esta cuenta todavía no ha comprado nada."
              />
            ) : (
              <Card>
                <CardContent>
                  <ul className="flex flex-col divide-y divide-ink-100">
                    {usuario.pedidos.map((pedido) => {
                      const estado = pedido.status as PedidoStatus;

                      return (
                        <li
                          key={pedido.id}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div>
                            <Link
                              href={`/admin/pedidos/${pedido.id}`}
                              className="font-mono text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-brand-600"
                            >
                              {idCorto(pedido.id)}
                            </Link>
                            <p className="text-xs text-ink-500">
                              {fecha(pedido.created_at)} · {pedido.articulos}{" "}
                              líneas
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-ink-900">
                              {importe(pedido.total)}
                            </span>
                            <Badge
                              tone={PEDIDO_STATUS_TONE[estado] ?? "neutral"}
                              size="sm"
                            >
                              {PEDIDO_STATUS_LABEL[estado] ?? estado}
                            </Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
          </Seccion>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <UsuarioAcciones
                usuarioId={usuario.id}
                email={usuario.email}
                esAdmin={usuario.es_admin}
                bloqueado={usuario.bloqueado}
                soyYo={soyYo}
              />
            </CardContent>
          </Card>

          <div className="mt-4">
            <AlertBanner tone="info">
              El rol de administrador vive en{" "}
              <code className="font-mono">raw_app_meta_data</code> de la cuenta,
              no en la base de datos del negocio. Por eso un cambio de rol
              necesita que la persona refresque su sesión.
            </AlertBanner>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

function Dato({
  termino,
  valor,
  mono,
}: {
  termino: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {termino}
      </dt>
      <dd
        className={
          mono
            ? "mt-0.5 break-all font-mono text-xs text-ink-800"
            : "mt-0.5 break-words text-ink-900"
        }
      >
        {valor}
      </dd>
    </div>
  );
}
