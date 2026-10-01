"use client";

import { useActionState, useState, useTransition } from "react";

import { updateUsuario } from "@/app/admin/actions/usuarios";
import type { AdminActionState } from "@/app/admin/actions/productos";
import { setAdminRole } from "@/app/admin/actions/usuarios";
import { Button } from "@/components/admin/ui/button";
import { Field, inputClass } from "@/components/admin/ui/form";
import type { Profile } from "@/lib/db/types";

export function UserProfileForm({
  usuarioId,
  perfil,
}: {
  usuarioId: string;
  perfil: Profile;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    updateUsuario,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5 p-5">
      <input type="hidden" name="id" value={usuarioId} />

      <Field label="Nombre completo" htmlFor="full_nombre">
        <input
          id="full_nombre"
          name="full_nombre"
          className={inputClass}
          defaultValue={perfil.full_nombre ?? ""}
        />
      </Field>

      <Field label="Teléfono" htmlFor="telefono">
        <input
          id="telefono"
          name="telefono"
          type="tel"
          className={inputClass}
          defaultValue={perfil.telefono ?? ""}
        />
      </Field>

      <Field label="Dirección" htmlFor="direccion_calle">
        <input
          id="direccion_calle"
          name="direccion_calle"
          className={inputClass}
          defaultValue={perfil.direccion_calle ?? ""}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Código postal" htmlFor="direccion_codigo_postal">
          <input
            id="direccion_codigo_postal"
            name="direccion_codigo_postal"
            className={inputClass}
            defaultValue={perfil.direccion_codigo_postal ?? ""}
          />
        </Field>
        <Field label="Ciudad" htmlFor="direccion_ciudad">
          <input
            id="direccion_ciudad"
            name="direccion_ciudad"
            className={inputClass}
            defaultValue={perfil.direccion_ciudad ?? ""}
          />
        </Field>
        <Field label="Provincia" htmlFor="direccion_provincia">
          <input
            id="direccion_provincia"
            name="direccion_provincia"
            className={inputClass}
            defaultValue={perfil.direccion_provincia ?? ""}
          />
        </Field>
      </div>

      <Field label="País" htmlFor="direccion_pais">
        <input
          id="direccion_pais"
          name="direccion_pais"
          className={inputClass}
          defaultValue={perfil.direccion_pais ?? "España"}
        />
      </Field>

      {state.success ? (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
        >
          {state.success}
        </p>
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Promueve o degrada a admin. `esElPropioAdmin` desactiva el botón de
 * degradación para que nadie se quede sin acceso al panel por error.
 */
export function ToggleAdminButton({
  usuarioId,
  email,
  esAdmin,
  esElPropioAdmin,
}: {
  usuarioId: string;
  email: string;
  esAdmin: boolean;
  esElPropioAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{
    texto: string;
    error: boolean;
  } | null>(null);

  return (
    <div>
      <Button
        type="button"
        variant={esAdmin ? "neutral" : "primary"}
        disabled={pending || (esAdmin && esElPropioAdmin)}
        onClick={() => {
          setMensaje(null);

          startTransition(async () => {
            const resultado = await setAdminRole(usuarioId, !esAdmin);

            setMensaje({
              texto:
                resultado.success ??
                resultado.error ??
                "No hemos podido cambiar el rol.",
              error: Boolean(resultado.error),
            });
          });
        }}
      >
        {pending
          ? "Guardando..."
          : esAdmin
            ? "Quitar acceso al panel"
            : "Dar acceso al panel"}
      </Button>

      {mensaje ? (
        <p
          role={mensaje.error ? "alert" : "status"}
          className={`mt-2 max-w-md text-sm ${
            mensaje.error
              ? "text-red-700 dark:text-red-400"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {mensaje.texto}
        </p>
      ) : null}

      {esAdmin && esElPropioAdmin ? (
        <p className="mt-2 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
          No puedes quitarte a ti mismo el rol. Pídeselo a otro administrador.
        </p>
      ) : null}

      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        El acceso se concede con <code>app_metadata.role = admin</code> en{" "}
        <code>{email}</code>.
      </p>
    </div>
  );
}
