"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Filtros del listado de usuarios.
 *
 * Búsqueda con debounce de 400 ms, como en `components/admin/producto-filtros.tsx`.
 */
export default function UsuarioFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const inicial = searchParams.get("q") ?? "";
  const [borrador, setBorrador] = useState(inicial);

  useEffect(() => {
    setBorrador(inicial);
  }, [inicial]);

  const aplicar = (valor: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set("q", valor);
    } else {
      params.delete("q");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (borrador === inicial) return;

    const temporizador = setTimeout(() => aplicar(borrador || null), 400);
    return () => clearTimeout(temporizador);
    // `aplicar` cambia en cada render; no debe relanzar el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrador, inicial]);

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicar(borrador || null);
      }}
      className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="flex-1">
        <label htmlFor="filtro-usuarios" className="sr-only">
          Buscar usuarios
        </label>
        <input
          id="filtro-usuarios"
          type="search"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          placeholder="Buscar por email o nombre"
          className="w-full rounded-card border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400"
        />
      </div>

      {inicial ? (
        <Link
          href={pathname}
          className="text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-950"
        >
          Limpiar búsqueda
        </Link>
      ) : null}
    </form>
  );
}
