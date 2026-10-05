"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  BOTON_PELIGRO,
  BOTON_SECUNDARIO,
  MensajeAccion,
} from "@/components/admin/campos";
import {
  bloquearUsuario,
  cambiarRol,
  descargarDatosUsuario,
  eliminarDatosUsuario,
} from "@/app/admin/usuarios/actions";
import type { AdminActionState } from "@/lib/admin/tipos";

/**
 * Acciones sobre una cuenta de usuario.
 *
 * Todas son irreversibles o casi, así que cada una pide confirmación con
 * `window.confirm` explicando qué pasa exactamente. En el caso de la supresión
 * el texto es deliberadamente explícito sobre lo que NO se borra: decir "se
 * eliminará el usuario" cuando en realidad se anonimiza sería una mentira en la
 * interfaz.
 */
export default function UsuarioAcciones({
  usuarioId,
  email,
  esAdmin,
  bloqueado,
  soyYo,
}: {
  usuarioId: string;
  email: string | null;
  esAdmin: boolean;
  bloqueado: boolean;
  /** La cuenta abierta es la del propio administrador. */
  soyYo: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState<AdminActionState>({});

  const ejecutar = (
    accion: () => Promise<
      AdminActionState & { archivo?: { nombre: string; contenido: string } }
    >,
    guardarMensaje = true,
  ) => {
    iniciarTransicion(async () => {
      const resultado = await accion();

      if (guardarMensaje) setMensaje(resultado);

      if (resultado.error) {
        toast.error(resultado.error);
      } else if (resultado.success) {
        toast.success(resultado.success);
      }

      if (resultado.archivo) {
        // Se genera en el cliente y se descarga al momento: no queda copia en
        // ningún servidor.
        const blob = new Blob([resultado.archivo.contenido], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = resultado.archivo.nombre;
        enlace.click();
        URL.revokeObjectURL(url);
      }

      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <MensajeAccion success={mensaje.success} error={mensaje.error} />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pendiente || soyYo}
          onClick={() => {
            if (!soyYo) {
              ejecutar(() => cambiarRol(usuarioId, !esAdmin));
            }
          }}
          className={BOTON_SECUNDARIO}
          title={
            soyYo
              ? "No puedes cambiar tu propio rol: te quedarías fuera del panel."
              : undefined
          }
        >
          {esAdmin
            ? "Quitar el rol de administrador"
            : "Conceder rol de administrador"}
        </button>

        <button
          type="button"
          disabled={pendiente || soyYo}
          onClick={() => {
            if (soyYo) return;
            if (
              !window.confirm(
                bloqueado
                  ? `¿Desbloquear la cuenta de ${email ?? "esta persona"}?`
                  : `¿Bloquear la cuenta de ${email ?? "esta persona"}?\n\nNo podrá iniciar sesión hasta que se desbloquee.`,
              )
            ) {
              return;
            }
            ejecutar(() => bloquearUsuario(usuarioId, !bloqueado));
          }}
          className={BOTON_SECUNDARIO}
        >
          {bloqueado ? "Desbloquear la cuenta" : "Bloquear la cuenta"}
        </button>

        <button
          type="button"
          disabled={pendiente}
          onClick={() =>
            ejecutar(() => descargarDatosUsuario(usuarioId), false)
          }
          className={BOTON_SECUNDARIO}
        >
          Descargar sus datos (RGPD)
        </button>

        <button
          type="button"
          disabled={pendiente || soyYo}
          onClick={() => {
            if (soyYo) return;
            if (
              !window.confirm(
                `¿Eliminar los datos personales de ${email ?? "esta persona"}?\n\nSe borrará su perfil, su lista de deseos y su carrito, y la cuenta quedará anonimizada y bloqueada: el email se sustituye por una dirección inválida.\n\nNO se borra el historial de pedidos, que se conserva por obligación legal de facturación.\n\nNo se puede deshacer.`,
              )
            ) {
              return;
            }
            ejecutar(() => eliminarDatosUsuario(usuarioId));
          }}
          className={BOTON_PELIGRO}
        >
          Eliminar sus datos personales
        </button>
      </div>

      {soyYo ? (
        <p className="text-xs text-ink-500">
          Esta es tu propia cuenta. Cambiar tu rol o bloquearte te dejaría sin
          acceso al panel, así que esas acciones están desactivadas.
        </p>
      ) : null}
    </div>
  );
}
