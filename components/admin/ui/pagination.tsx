import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Reconstruye la query conservando los filtros activos. */
  buildHref: (page: number) => string;
};

/**
 * Paginación accesible. `buildHref` recibe la página destino para que cada
 * enlace mantenga los filtros de búsqueda/estado de la URL actual.
 */
export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(page, totalPages);

  return (
    <nav
      aria-label="Paginación"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-neutral-500 dark:text-neutral-400">
        Página {page} de {totalPages}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link
              href={buildHref(page - 1)}
              rel="prev"
              className="rounded-md border border-neutral-300 px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Anterior
            </Link>
          ) : (
            <span className="rounded-md border border-neutral-200 px-3 py-1.5 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600">
              Anterior
            </span>
          )}
        </li>

        {pages.map((entry, index) =>
          entry === null ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-neutral-400"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={buildHref(entry)}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`Página ${entry}`}
                className={
                  entry === page
                    ? "rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white dark:bg-white dark:text-neutral-900"
                    : "rounded-md border border-neutral-300 px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                }
              >
                {entry}
              </Link>
            </li>
          ),
        )}

        <li>
          {page < totalPages ? (
            <Link
              href={buildHref(page + 1)}
              rel="next"
              className="rounded-md border border-neutral-300 px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Siguiente
            </Link>
          ) : (
            <span className="rounded-md border border-neutral-200 px-3 py-1.5 text-neutral-300 dark:border-neutral-800 dark:text-neutral-600">
              Siguiente
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

/** Ventana de páginas: 1 … 4 5 [6] 7 8 … 20 */
function getVisiblePages(page: number, totalPages: number) {
  const pages: Array<number | null> = [];

  for (let i = 1; i <= totalPages; i++) {
    const isEdge = i === 1 || i === totalPages;
    const isNear = Math.abs(i - page) <= 1;

    if (isEdge || isNear) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null);
    }
  }

  return pages;
}
