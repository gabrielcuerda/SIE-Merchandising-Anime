"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  BOTON_SECUNDARIO,
  Campo,
  Input,
  MensajeAccion,
} from "@/components/admin/campos";
import { guardarVariantes } from "@/app/admin/productos/actions";
import { precioSinIVA } from "@/lib/admin/formato";
import type {
  AdminActionState,
  ProductoVarianteAdmin,
} from "@/lib/admin/tipos";

type Opcion = { name: string; value: string };

type Fila = {
  /** `null` = variante nueva sin guardar todavía. */
  id: string | null;
  titulo: string;
  sku: string;
  precio: string;
  stock: string;
  opciones: Opcion[];
};

/**
 * Editor de variantes.
 *
 * Las variantes se mandan todas juntas como un JSON en un campo oculto, en vez
 * de N campos `<name="titulo">`. El motivo es concreto: con `FormData` plano el
 * servidor no puede saber a qué variante pertenece cada valor cuando el
 * formulario es dinámico. La RPC `admin_variante_upsert` resuelve el resto.
 *
 * Si un producto no tiene variantes, `lib/commerce/products.ts` sintetiza una
 * "Default Title" con el precio del propio producto. Añadir variantes es
 * opcional, no obligatorio.
 */
export default function ProductoVariantes({
  productoId,
  variantes,
}: {
  productoId: string;
  variantes: ProductoVarianteAdmin[];
}) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState<AdminActionState>({});

  const [filas, setFilas] = useState<Fila[]>(() =>
    variantes.map((variante) => ({
      id: variante.id,
      titulo: variante.titulo,
      sku: variante.sku ?? "",
      precio: String(variante.precio),
      stock: String(variante.stock),
      opciones: Array.isArray(variante.opciones)
        ? variante.opciones.map((o) => ({
            name: String(o.name),
            value: String(o.value),
          }))
        : [],
    })),
  );

  const actualizar = (indice: number, cambios: Partial<Fila>) => {
    setFilas((previas) =>
      previas.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    );
  };

  const anadir = () => {
    setFilas((previas) => [
      ...previas,
      {
        id: null,
        titulo: "",
        sku: "",
        precio: "",
        stock: "0",
        opciones: [],
      },
    ]);
  };

  const quitar = (indice: number) => {
    setFilas((previas) => previas.filter((_, i) => i !== indice));
  };

  const guardar = () => {
    iniciarTransicion(async () => {
      const resultado = await guardarVariantes(
        productoId,
        JSON.stringify(filas),
      );
      setMensaje(resultado);

      if (resultado.error) toast.error(resultado.error);
      else toast.success(resultado.success ?? "Variantes guardadas.");

      router.refresh();
    });
  };

  const preciosInconsistentes = filas.some(
    (fila) => fila.precio !== "" && Number.isNaN(Number(fila.precio)),
  );

  return (
    <div className="flex flex-col gap-4">
      {filas.length === 0 ? (
        <p className="rounded-card border border-dashed border-ink-300 bg-ink-50/50 px-4 py-8 text-center text-sm text-ink-500">
          Este producto no tiene variantes. Si no añades ninguna, se mostrará
          con una única variante al precio del propio producto.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {filas.map((fila, indice) => (
            <li
              key={fila.id ?? `nueva-${indice}`}
              className="flex flex-col gap-4 rounded-card border border-ink-200 bg-white p-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Campo
                  etiqueta="Título"
                  htmlFor={`variante-titulo-${indice}`}
                  requerido
                  className="sm:col-span-2"
                >
                  <Input
                    id={`variante-titulo-${indice}`}
                    value={fila.titulo}
                    onChange={(e) =>
                      actualizar(indice, { titulo: e.target.value })
                    }
                    placeholder="Edición limitada"
                  />
                </Campo>

                <Campo
                  etiqueta="Precio (sin IVA)"
                  htmlFor={`variante-precio-${indice}`}
                >
                  <Input
                    id={`variante-precio-${indice}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={fila.precio}
                    onChange={(e) =>
                      actualizar(indice, { precio: e.target.value })
                    }
                  />
                </Campo>

                <Campo etiqueta="Stock" htmlFor={`variante-stock-${indice}`}>
                  <Input
                    id={`variante-stock-${indice}`}
                    type="number"
                    min="0"
                    step="1"
                    value={fila.stock}
                    onChange={(e) =>
                      actualizar(indice, { stock: e.target.value })
                    }
                  />
                </Campo>

                <Campo etiqueta="SKU" htmlFor={`variante-sku-${indice}`}>
                  <Input
                    id={`variante-sku-${indice}`}
                    value={fila.sku}
                    onChange={(e) =>
                      actualizar(indice, { sku: e.target.value })
                    }
                  />
                </Campo>
              </div>

              <fieldset className="rounded-card border border-ink-200 p-3">
                <legend className="px-1 text-xs font-semibold text-ink-500">
                  Opciones (talla, color…)
                </legend>

                <ul className="flex flex-col gap-2">
                  {fila.opciones.map((opcion, iOpcion) => (
                    <li key={iOpcion} className="flex items-center gap-2">
                      <Input
                        aria-label={`Nombre de la opción ${iOpcion + 1}`}
                        value={opcion.name}
                        placeholder="Talla"
                        onChange={(e) =>
                          actualizar(indice, {
                            opciones: fila.opciones.map((o, j) =>
                              j === iOpcion
                                ? { ...o, name: e.target.value }
                                : o,
                            ),
                          })
                        }
                        className="w-32"
                      />
                      <Input
                        aria-label={`Valor de la opción ${iOpcion + 1}`}
                        value={opcion.value}
                        placeholder="M"
                        onChange={(e) =>
                          actualizar(indice, {
                            opciones: fila.opciones.map((o, j) =>
                              j === iOpcion
                                ? { ...o, value: e.target.value }
                                : o,
                            ),
                          })
                        }
                        className="w-24"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          actualizar(indice, {
                            opciones: fila.opciones.filter(
                              (_, j) => j !== iOpcion,
                            ),
                          })
                        }
                        className="rounded-card px-2 py-1 text-xs font-medium text-alert-700 hover:bg-alert-50"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() =>
                    actualizar(indice, {
                      opciones: [...fila.opciones, { name: "", value: "" }],
                    })
                  }
                  className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  + Añadir opción
                </button>
              </fieldset>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-ink-500">
                  {fila.id ? "Guardada" : "Nueva"} ·{" "}
                  {fila.precio
                    ? precioSinIVA(Number(fila.precio))
                    : "sin precio"}
                </span>
                <button
                  type="button"
                  onClick={() => quitar(indice)}
                  className="rounded-card px-2 py-1 text-xs font-semibold text-alert-700 hover:bg-alert-50"
                >
                  {fila.id ? "Eliminar variante" : "Quitar fila"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MensajeAccion success={mensaje.success} error={mensaje.error} />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={anadir} className={BOTON_SECUNDARIO}>
          + Añadir variante
        </button>
        <button
          type="button"
          disabled={pendiente || preciosInconsistentes}
          onClick={guardar}
          className="rounded-card bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : "Guardar variantes"}
        </button>
      </div>
    </div>
  );
}
