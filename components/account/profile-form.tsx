"use client";

import { AccountActionState, updateProfile } from "@/app/account/actions";
import { useActionState } from "react";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white";

type ProfileFormProps = {
  fullNombre: string;
  telefono: string;
};

export default function ProfileForm({
  fullNombre,
  telefono,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<
    AccountActionState,
    FormData
  >(updateProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="full_nombre">
          Nombre completo
        </label>
        <input
          id="full_nombre"
          name="full_nombre"
          className={inputClass}
          type="text"
          defaultValue={fullNombre}
          autoComplete="name"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="telefono">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          className={inputClass}
          type="tel"
          defaultValue={telefono}
          autoComplete="tel"
        />
      </div>

      {state.success ? (
        <p
          className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
          role="status"
        >
          {state.success}
        </p>
      ) : null}
      {state.error ? (
        <p
          className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
