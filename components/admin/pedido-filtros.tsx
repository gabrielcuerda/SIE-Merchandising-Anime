"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PEDIDO_STATUS, PEDIDO_STATUS_LABEL } from "@/lib/admin/tipos";

/**
 * Filtros del listado de pedidos.
 *
 * Viven en la URL y no en `useState`, como el resto de filtros del panel: el
 * listado se puede compartir y el botón "volver" del navegador funciona. Aquí
 * no hay debounce porque los campos son un `<select>` y dos `<input type="date">`,
 * no un campo de texto libre.
 */
export default function PedidoFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";

  const aplicar = (cambios: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [clave, valor] of Object.entries(cambios)) {
      if (!valor) {
        params.delete(clave);
      } else {
        params.set(clave, valor);
      }
    }

    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hayFiltros = Boolean(status || desde || hasta);

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
      }}
      className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="sm:w-48">
        <label
          htmlFor="filtro-estado"
          className="mb-1 block text-xs font-semibold text-ink-600"
        >
          Estado
        </label>
        <select
          id="filtro-estado"
          value={status}
          onChange={(e) => aplicar({ status: e.target.value || null })}
          className="w-full rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        >
          <option value="">Todos</option>
          {PEDIDO_STATUS.map((valor) => (
            <option key={valor} value={valor}>
              {PEDIDO_STATUS_LABEL[valor]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="filtro-desde"
          className="mb-1 block text-xs font-semibold text-ink-600"
        >
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={desde}
          onChange={(e) => aplicar({ desde: e.target.value || null })}
          className="rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        />
      </div>

      <div>
        <label
          htmlFor="filtro-hasta"
          className="mb-1 block text-xs font-semibold text-ink-600"
        >
          Hasta
        </label>
        <input
          id="filtro-hasta"
          type="date"
          value={hasta}
          onChange={(e) => aplicar({ hasta: e.target.value || null })}
          className="rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900"
        />
      </div>

      {hayFiltros ? (
        <Link
          href={pathname}
          className="pb-2 text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-950"
        >
          Limpiar filtros
        </Link>
      ) : null}
    </form>
  );
}
