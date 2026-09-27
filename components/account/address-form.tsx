"use client";

import { AccountActionState, updateAddress } from "@/app/account/actions";
import { useActionState } from "react";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white";

type AddressFormProps = {
  calle: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  pais: string;
};

export default function AddressForm({
  calle,
  ciudad,
  provincia,
  codigoPostal,
  pais,
}: AddressFormProps) {
  const [state, formAction, pending] = useActionState<
    AccountActionState,
    FormData
  >(updateAddress, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor="direccion_calle"
        >
          Dirección
        </label>
        <input
          id="direccion_calle"
          name="direccion_calle"
          className={inputClass}
          type="text"
          defaultValue={calle}
          autoComplete="street-address"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="direccion_ciudad"
          >
            Ciudad
          </label>
          <input
            id="direccion_ciudad"
            name="direccion_ciudad"
            className={inputClass}
            type="text"
            defaultValue={ciudad}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="direccion_provincia"
          >
            Provincia
          </label>
          <input
            id="direccion_provincia"
            name="direccion_provincia"
            className={inputClass}
            type="text"
            defaultValue={provincia}
            autoComplete="address-level1"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="direccion_codigo_postal"
          >
            Código postal
          </label>
          <input
            id="direccion_codigo_postal"
            name="direccion_codigo_postal"
            className={inputClass}
            type="text"
            defaultValue={codigoPostal}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            htmlFor="direccion_pais"
          >
            País
          </label>
          <input
            id="direccion_pais"
            name="direccion_pais"
            className={inputClass}
            type="text"
            defaultValue={pais}
            autoComplete="country-name"
          />
        </div>
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
        {pending ? "Guardando..." : "Guardar dirección"}
      </button>
    </form>
  );
}
