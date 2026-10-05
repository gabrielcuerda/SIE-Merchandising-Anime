"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui";
import {
  eliminarCategoria,
  moverCategoria,
} from "@/app/admin/categorias/actions";
import type { NodoCategoria } from "@/lib/admin/tipos";

/**
 * Árbol de categorías del panel.
 *
 * Es un Client Component porque cada fila dispara Server Actions con
 * `useTransition` (`moverCategoria`, `eliminarCategoria`) y necesita
 * `router.refresh()` para que el servidor vuelva a leer el nuevo orden.
 *
 * `esPrimera` / `esUltima` deshabilitan las flechas en los extremos del nivel:
 * `admin_categoria_reordenar` ya devuelve sin error cuando no hay hermana con la
 * que intercambiar, pero un botón deshabilitado explica mejor por qué.
 */
export default function CategoriaArbol({ nodos }: { nodos: NodoCategoria[] }) {
  return (
    <ul className="flex flex-col divide-y divide-ink-100">
      {nodos.map((nodo, indice) => (
        <FilaCategoria
          key={nodo.id}
          nodo={nodo}
          profundidad={0}
          esPrimera={indice === 0}
          esUltima={indice === nodos.length - 1}
        />
      ))}
    </ul>
  );
}

function FilaCategoria({
  nodo,
  profundidad,
  esPrimera,
  esUltima,
}: {
  nodo: NodoCategoria;
  profundidad: number;
  esPrimera: boolean;
  esUltima: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  const ejecutar = (
    accion: () => Promise<{ success?: string; error?: string } | undefined>,
    confirmar?: string,
  ) => {
    if (confirmar && !window.confirm(confirmar)) return;

    iniciarTransicion(async () => {
      const resultado = await accion();

      if (resultado?.error) toast.error(resultado.error);
      else if (resultado?.success) toast.success(resultado.success);

      router.refresh();
    });
  };

  const ocupada = nodo.total_productos > 0 || nodo.hijas.length > 0;

  return (
    <>
      <li
        className={`flex flex-wrap items-center gap-3 py-3 ${pendiente ? "opacity-60" : ""}`}
        style={{ paddingLeft: `${profundidad * 1.5}rem` }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-900">{nodo.nombre}</span>
            <span className="text-xs text-ink-400">/{nodo.slug}</span>
            {nodo.total_productos === 0 ? (
              <Badge tone="warning" size="sm">
                Sin productos
              </Badge>
            ) : (
              <Badge tone="neutral" size="sm">
                {nodo.total_productos} productos
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pendiente || esPrimera}
            onClick={() => ejecutar(() => moverCategoria(nodo.id, -1))}
            aria-label={`Subir «${nodo.nombre}»`}
            className="rounded-card px-2 py-1 text-sm text-ink-600 hover:bg-ink-100 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={pendiente || esUltima}
            onClick={() => ejecutar(() => moverCategoria(nodo.id, 1))}
            aria-label={`Bajar «${nodo.nombre}»`}
            className="rounded-card px-2 py-1 text-sm text-ink-600 hover:bg-ink-100 disabled:opacity-30"
          >
            ↓
          </button>

          <Link
            href={`/admin/categorias/${nodo.id}`}
            className="rounded-card px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100"
          >
            Editar
          </Link>

          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              ejecutar(
                () => eliminarCategoria(nodo.id),
                ocupada
                  ? `«${nodo.nombre}» tiene ${nodo.total_productos} producto(s) y ${nodo.hijas.length} subcategoría(s). El borrado se rechazará hasta que los reasignes o los elimines. ¿Intentar de todas formas?`
                  : `¿Eliminar la categoría «${nodo.nombre}»?`,
              )
            }
            className="rounded-card px-2 py-1 text-xs font-semibold text-alert-700 hover:bg-alert-50 disabled:opacity-50"
          >
            Borrar
          </button>
        </div>
      </li>

      {nodo.hijas.map((hija, indice) => (
        <FilaCategoria
          key={hija.id}
          nodo={hija}
          profundidad={profundidad + 1}
          esPrimera={indice === 0}
          esUltima={indice === nodo.hijas.length - 1}
        />
      ))}
    </>
  );
}
