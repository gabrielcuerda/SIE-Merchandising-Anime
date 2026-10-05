import type { ReactNode } from "react";

/**
 * Estructura común de las páginas del panel: cabecera, título, barra de
 * navegación y contenido.
 */
export function AdminPage({
  eyebrow,
  titulo,
  descripcion,
  acciones,
  children,
}: {
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <p className="section-eyebrow mb-1">{eyebrow}</p> : null}
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-950">
            {titulo}
          </h1>
          {descripcion ? (
            <p className="mt-1 text-sm text-ink-500">{descripcion}</p>
          ) : null}
        </div>
        {acciones ? (
          <div className="flex shrink-0 items-center gap-2">{acciones}</div>
        ) : null}
      </header>

      {children}
    </div>
  );
}

/** Bloque de contenido a la derecha de la navegación lateral. */
export function AdminPanelBody({ children }: { children: ReactNode }) {
  return <div className="min-w-0 flex-1">{children}</div>;
}

/** Párrafo introductorio sobre una sección. */
export function AdminNota({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-ink-500">{children}</p>;
}

/**
 * Estado vacío honesto.
 *
 * `pedidos`, `producto_variantes` y `producto_imagenes` están vacías en la base
 * de datos, así que estos estados se van a ver de verdad. No se rellenan con
 * datos de ejemplo: un panel que miente sobre su contenido no sirve para
 * comprobar nada.
 */
export function AdminVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-ink-300 bg-ink-50/50 px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink-900">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
        {descripcion}
      </p>
      {accion ? <div className="mt-5">{accion}</div> : null}
    </div>
  );
}
