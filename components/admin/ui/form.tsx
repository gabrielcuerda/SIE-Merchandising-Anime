import clsx from "clsx";
import { cloneElement, isValidElement, type ReactElement } from "react";

export const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white";

type AriaProps = {
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * Envoltorio de campo: label, control, ayuda y error.
 *
 * El control se clona para inyectarle `aria-describedby` y `aria-invalid`, de
 * forma que un lector de pantalla anuncie la ayuda y el error al enfocarlo. El
 * `id` del hint y del error se derivan de `htmlFor`, que es la única
 * convención que se puede asumir aquí.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const describedBy =
    [error ? `${htmlFor}-error` : null, hint ? `${htmlFor}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-red-600">
            *
          </span>
        ) : null}
      </label>

      {hint ? (
        <p
          id={`${htmlFor}-hint`}
          className="text-xs text-neutral-500 dark:text-neutral-400"
        >
          {hint}
        </p>
      ) : null}

      {isValidElement(children)
        ? cloneElement(children as ReactElement<AriaProps>, {
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy,
          })
        : children}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
