"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Paginación por `searchParams`.
 *
 * Conserva el resto de filtros al construir los enlaces: si no, cambiar de
 * página perdería la búsqueda activa.
 */
export default function Paginacion({
  pagina,
  paginas,
  total,
  porPagina,
}: {
  pagina: number;
  paginas: number;
  total: number;
  porPagina: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (paginas <= 1) {
    return (
      <p className="mt-4 text-sm text-ink-500">
        {total} {total === 1 ? "producto" : "productos"}
      </p>
    );
  }

  const enlace = (destino: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", String(destino));
    return `${pathname}?${params.toString()}`;
  };

  const primero = Math.max(pagina - 2, 1);
  const ultimo = Math.min(pagina + 2, paginas);
  const numeros = Array.from(
    { length: ultimo - primero + 1 },
    (_, i) => primero + i,
  );

  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-500">
        Mostrando {desde}–{hasta} de {total}
      </p>

      <nav aria-label="Paginación" className="flex items-center gap-1">
        {pagina > 1 ? (
          <Link
            href={enlace(pagina - 1)}
            rel="prev"
            className="rounded-card border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Anterior
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-card border border-ink-200 px-3 py-1.5 text-sm text-ink-300">
            Anterior
          </span>
        )}

        {numeros.map((n) =>
          n === pagina ? (
            <span
              key={n}
              aria-current="page"
              className="rounded-card bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              {n}
            </span>
          ) : (
            <Link
              key={n}
              href={enlace(n)}
              className="rounded-card border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              {n}
            </Link>
          ),
        )}

        {pagina < paginas ? (
          <Link
            href={enlace(pagina + 1)}
            rel="next"
            className="rounded-card border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Siguiente
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-card border border-ink-200 px-3 py-1.5 text-sm text-ink-300">
            Siguiente
          </span>
        )}
      </nav>
    </div>
  );
}
