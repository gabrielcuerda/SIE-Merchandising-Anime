"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PRODUCTO_STATUS, PRODUCTO_STATUS_LABEL } from "@/lib/admin/tipos";

/**
 * Filtros del listado de productos.
 *
 * Los filtros viven en la URL (`searchParams`) y no en `useState`: así el
 * listado es compartible, el botón "volver" del navegador funciona y la página
 * se puede renderizar en servidor. El input de búsqueda lleva su propio debounce
 * porque escribir no debe disparar una navegación por cada tecla.
 */
export default function ProductoFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const busquedaInicial = searchParams.get("q") ?? "";
  const statusInicial = searchParams.get("status") ?? "";

  const [borrador, setBorrador] = useState(busquedaInicial);

  // Si la URL cambia desde fuera (paginación, enlace de otro sitio), el input
  // se sincroniza.
  useEffect(() => {
    setBorrador(busquedaInicial);
  }, [busquedaInicial]);

  const aplicar = (cambios: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [clave, valor] of Object.entries(cambios)) {
      if (!valor) {
        params.delete(clave);
      } else {
        params.set(clave, valor);
      }
    }

    // Cualquier cambio de filtro vuelve a la primera página.
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Debounce de 400 ms para no navegar en cada pulsación.
  useEffect(() => {
    if (borrador === busquedaInicial) return;

    const temporizador = setTimeout(() => {
      aplicar({ q: borrador || null });
    }, 400);

    return () => clearTimeout(temporizador);
    // `aplicar` cambia en cada render; no debe disparar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrador, busquedaInicial]);

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicar({ q: borrador || null });
      }}
      className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="filtro-q" className="sr-only">
          Buscar productos
        </label>
        <input
          id="filtro-q"
          type="search"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          placeholder="Buscar por título, descripción o SKU"
          className="w-full rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400"
        />
      </div>

      <div className="sm:w-56">
        <label htmlFor="filtro-status" className="sr-only">
          Filtrar por estado
        </label>
        <select
          id="filtro-status"
          value={statusInicial}
          onChange={(e) => aplicar({ status: e.target.value || null })}
          className="w-full rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        >
          <option value="">Todos los estados</option>
          {PRODUCTO_STATUS.map((status) => (
            <option key={status} value={status}>
              {PRODUCTO_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      {busquedaInicial || statusInicial ? (
        <Link
          href={pathname}
          className="text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-950"
        >
          Limpiar filtros
        </Link>
      ) : null}
    </form>
  );
}
