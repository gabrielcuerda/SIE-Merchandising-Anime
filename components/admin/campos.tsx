import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

/**
 * Primitivas de formulario del panel.
 *
 * Centralizan las clases en lugar de repetir la misma cadena de Tailwind en cada
 * input. El patrón es el de `app/account/profile-form.tsx`, que define un
 * `inputClass` local; aquí se extrae porque el panel tiene muchos más campos.
 */

export const CLASE_INPUT =
  "w-full rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 " +
  "placeholder:text-ink-400 disabled:bg-ink-50 disabled:text-ink-400";

export const CLASE_BOTON =
  "inline-flex items-center justify-center gap-2 rounded-card px-4 py-2 " +
  "text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export const BOTON_PRIMARIO = clsx(
  CLASE_BOTON,
  "bg-brand-600 text-white hover:bg-brand-700",
);

export const BOTON_SECUNDARIO = clsx(
  CLASE_BOTON,
  "border border-ink-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50",
);

export const BOTON_PELIGRO = clsx(
  CLASE_BOTON,
  "border border-alert-300 bg-white text-alert-700 hover:border-alert-500 hover:bg-alert-50",
);

export const BOTON_PELIGRO_SOLIDO = clsx(
  CLASE_BOTON,
  "bg-alert-600 text-white hover:bg-alert-700",
);

export function Campo({
  etiqueta,
  htmlFor,
  ayuda,
  error,
  requerido,
  children,
  className,
}: {
  etiqueta: string;
  htmlFor: string;
  ayuda?: ReactNode;
  error?: string | null;
  requerido?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-800">
        {etiqueta}
        {requerido ? (
          <span aria-hidden="true" className="ml-0.5 text-alert-600">
            *
          </span>
        ) : null}
      </label>
      {children}
      {ayuda ? <p className="text-xs text-ink-500">{ayuda}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-alert-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Mensaje de resultado de una Server Action.
 *
 * `success` usa `role="status"` y `error` usa `role="alert"`, siguiendo el
 * patrón de `components/account/profile-form.tsx`: así un lector de pantalla
 * anuncia el error, que es lo que de verdad importa.
 */
export function MensajeAccion({
  success,
  error,
}: {
  success?: string | null;
  error?: string | null;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-card border border-alert-300 bg-alert-50 px-4 py-3 text-sm font-medium text-alert-700"
      >
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p
        role="status"
        className="rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700"
      >
        {success}
      </p>
    );
  }

  return null;
}

/** Tabla semántica: `components/ui` no tiene `Table`. */
export function Tabla({
  columnas,
  children,
}: {
  columnas: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink-200">
            {columnas.map((columna) => (
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
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

/** Envoltorio estándar de las tarjetas del panel. */
export function Seccion({
  titulo,
  descripcion,
  acciones,
  children,
  className,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("mb-8", className)}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-ink-500">
            {titulo}
          </h2>
          {descripcion ? (
            <p className="mt-1 text-sm text-ink-500">{descripcion}</p>
          ) : null}
        </div>
        {acciones ? (
          <div className="flex shrink-0 items-center gap-2">{acciones}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Input de texto con las clases del panel. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={clsx(CLASE_INPUT, className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={clsx(CLASE_INPUT, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={clsx(CLASE_INPUT, "min-h-24 resize-y", className)}
    />
  );
}
