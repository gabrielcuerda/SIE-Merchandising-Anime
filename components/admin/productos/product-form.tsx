"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import {
  saveProducto,
  type AdminActionState,
} from "@/app/admin/actions/productos";
import { Button } from "@/components/admin/ui/button";
import { Field, inputClass } from "@/components/admin/ui/form";
import { Panel } from "@/components/admin/ui/panel";
import { productoStatusLabels, type ProductoStatus } from "@/lib/admin/constants";
import { slugify } from "@/lib/admin/storage";
import type { Categoria } from "@/lib/db/types";

export type VarianteForm = {
  /**
   * Clave estable de la fila. NO es el id de la base de datos: las variantes
   * recién añadidas aún no lo tienen, y usar el índice como `key` de React
   * remontaría los inputs al borrar una fila del medio y perdería el foco.
   */
  key: string;
  /** Id en `producto_variantes`. Vacío mientras la variante no se ha guardado. */
  id?: string;
  titulo: string;
  sku: string;
  precio: string;
  stock: string;
};

export type ProductoFormValues = {
  id?: string;
  titulo: string;
  slug: string;
  descripcion: string;
  precio: string;
  stock: string;
  status: ProductoStatus;
  categoria_id: string;
  destacado: boolean;
  sku: string;
  tags: string;
  variantes: VarianteForm[];
};

export const PRODUCTO_VACIO: ProductoFormValues = {
  titulo: "",
  slug: "",
  descripcion: "",
  precio: "",
  stock: "0",
  status: "stock",
  categoria_id: "",
  destacado: false,
  sku: "",
  tags: "",
  variantes: [],
};

/**
 * Formulario de alta/edición. El slug se autogenera del título mientras el
 * admin no lo toque a mano: es la fuente de la URL pública del producto.
 */
export function ProductForm({
  values,
  categorias,
  submitLabel,
}: {
  values: ProductoFormValues;
  categorias: Categoria[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    saveProducto,
    {},
  );

  const [slug, setSlug] = useState(values.slug);
  const [slugEditado, setSlugEditado] = useState(Boolean(values.slug));
  const [titulo, setTitulo] = useState(values.titulo);
  const [variantes, setVariantes] = useState<VarianteForm[]>(() =>
    values.variantes.map((variante, index) => ({
      ...variante,
      key: variante.id ?? `preexistente-${index}`,
    })),
  );

  // Contador para claves de variantes nuevas: evita depender del índice, que
  // cambia en cuanto se borra una fila.
  const contador = useRef(values.variantes.length);
  const nuevaKey = () => `nueva-${contador.current++}`;

  const errores = state.fieldErrors ?? {};

  const onTituloChange = (valor: string) => {
    setTitulo(valor);
    if (!slugEditado) {
      setSlug(slugify(valor));
    }
  };

  const actualizarVariante = (
    indice: number,
    campo: keyof Omit<VarianteForm, "id" | "key">,
    valor: string,
  ) => {
    setVariantes((actuales) =>
      actuales.map((variante, i) =>
        i === indice ? { ...variante, [campo]: valor } : variante,
      ),
    );
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {values.id ? (
        <input type="hidden" name="id" value={values.id} />
      ) : null}

      <Panel title="Datos básicos">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field
            label="Título"
            htmlFor="titulo"
            required
            error={errores.titulo}
            className="sm:col-span-2"
          >
            <input
              id="titulo"
              name="titulo"
              className={inputClass}
              value={titulo}
              onChange={(event) => onTituloChange(event.target.value)}
              required
              minLength={2}
              maxLength={200}
            />
          </Field>

          <Field
            label="Slug (URL)"
            htmlFor="slug"
            error={errores.slug}
            hint="Se genera del título. Edítalo sólo si lo necesitas."
          >
            <input
              id="slug"
              name="slug"
              className={inputClass}
              value={slug}
              onChange={(event) => {
                setSlugEditado(true);
                setSlug(event.target.value);
              }}
              pattern="[a-z0-9-]+"
            />
          </Field>

          <Field label="SKU" htmlFor="sku">
            <input
              id="sku"
              name="sku"
              className={inputClass}
              defaultValue={values.sku}
              maxLength={64}
            />
          </Field>

          <Field label="Precio (€)" htmlFor="precio" required error={errores.precio}>
            <input
              id="precio"
              name="precio"
              type="text"
              inputMode="decimal"
              className={inputClass}
              defaultValue={values.precio}
              required
            />
          </Field>

          <Field label="Stock" htmlFor="stock" required error={errores.stock}>
            <input
              id="stock"
              name="stock"
              type="number"
              min={0}
              step={1}
              className={inputClass}
              defaultValue={values.stock}
              required
            />
          </Field>

          <Field label="Estado" htmlFor="status" required error={errores.status}>
            <select
              id="status"
              name="status"
              className={inputClass}
              defaultValue={values.status}
            >
              {Object.entries(productoStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Categoría" htmlFor="categoria_id">
            <select
              id="categoria_id"
              name="categoria_id"
              className={inputClass}
              defaultValue={values.categoria_id}
            >
              <option value="">Sin categoría</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Etiquetas"
            htmlFor="tags"
            hint="Separadas por comas. Se usan en la búsqueda de la tienda."
          >
            <input
              id="tags"
              name="tags"
              className={inputClass}
              defaultValue={values.tags}
              placeholder="one piece, anime, figura"
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="destacado"
                defaultChecked={values.destacado}
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-600 dark:border-neutral-700"
              />
              <span className="text-neutral-800 dark:text-neutral-200">
                Destacado
              </span>
              <span className="text-xs text-neutral-500">
                (aparece en la portada de la tienda)
              </span>
            </label>
          </div>

          <Field
            label="Descripción"
            htmlFor="descripcion"
            className="sm:col-span-2"
            hint="Se muestra en la ficha de producto. Admite HTML básico."
          >
            <textarea
              id="descripcion"
              name="descripcion"
              rows={6}
              className={inputClass}
              defaultValue={values.descripcion}
            />
          </Field>
        </div>
      </Panel>

      <VariantesFieldset
        variantes={variantes}
        setVariantes={setVariantes}
        actualizar={actualizarVariante}
        nuevaKey={nuevaKey}
      />

      {state.success ? (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
        >
          {state.success}
        </p>
      ) : null}
      {state.error ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
        <Link
          href="/admin/productos"
          className="text-sm text-neutral-600 hover:underline dark:text-neutral-300"
        >
          Cancelar y volver al listado
        </Link>
      </div>
    </form>
  );
}

function VariantesFieldset({
  variantes,
  setVariantes,
  actualizar,
  nuevaKey,
}: {
  variantes: VarianteForm[];
  setVariantes: React.Dispatch<React.SetStateAction<VarianteForm[]>>;
  actualizar: (
    indice: number,
    campo: keyof Omit<VarianteForm, "id" | "key">,
    valor: string,
  ) => void;
  nuevaKey: () => string;
}) {
  return (
    <Panel
      title="Variantes"
      description="Tallas, colores o ediciones. Si el producto no las tiene, déjalo vacío."
    >
      <div className="flex flex-col gap-4 p-5">
        {variantes.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Este producto se vende como una única versión.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {variantes.map((variante, index) => (
              <li
                key={variante.key}
                className="grid gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-12 dark:border-neutral-800"
              >
                {/*
                  El id viaja oculto y vacío en las nuevas: el servidor lo usa
                  para decidir insertar o actualizar. El resto de campos se
                  nombran por índice porque `getAll` devuelve las filas en el
                  orden del DOM.
                */}
                <input
                  type="hidden"
                  name="variante_id"
                  value={variante.id ?? ""}
                />

                <div className="sm:col-span-5">
                  <label
                    htmlFor={`variante_titulo_${index}`}
                    className="mb-1 block text-xs font-medium"
                  >
                    Nombre
                  </label>
                  <input
                    id={`variante_titulo_${index}`}
                    name="variante_titulo"
                    className={inputClass}
                    value={variante.titulo}
                    onChange={(event) =>
                      actualizar(index, "titulo", event.target.value)
                    }
                    placeholder="Talla M"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor={`variante_sku_${index}`}
                    className="mb-1 block text-xs font-medium"
                  >
                    SKU
                  </label>
                  <input
                    id={`variante_sku_${index}`}
                    name={`variante_sku_${index}`}
                    className={inputClass}
                    value={variante.sku}
                    onChange={(event) =>
                      actualizar(index, "sku", event.target.value)
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`variante_precio_${index}`}
                    className="mb-1 block text-xs font-medium"
                  >
                    Precio
                  </label>
                  <input
                    id={`variante_precio_${index}`}
                    name={`variante_precio_${index}`}
                    type="text"
                    inputMode="decimal"
                    className={inputClass}
                    value={variante.precio}
                    onChange={(event) =>
                      actualizar(index, "precio", event.target.value)
                    }
                  />
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor={`variante_stock_${index}`}
                    className="mb-1 block text-xs font-medium"
                  >
                    Stock
                  </label>
                  <input
                    id={`variante_stock_${index}`}
                    name={`variante_stock_${index}`}
                    type="number"
                    min={0}
                    step={1}
                    className={inputClass}
                    value={variante.stock}
                    onChange={(event) =>
                      actualizar(index, "stock", event.target.value)
                    }
                  />
                </div>

                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() =>
                      setVariantes((actuales) =>
                        actuales.filter((_, i) => i !== index),
                      )
                    }
                    className="h-full w-full rounded-md border border-red-300 px-2 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                  >
                    <span className="sr-only">
                      Quitar variante {variante.titulo || index + 1}
                    </span>
                    <span aria-hidden>Quitar</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div>
          <Button
            type="button"
            variant="neutral"
            onClick={() =>
              setVariantes((actuales) => [
                ...actuales,
                { key: nuevaKey(), titulo: "", sku: "", precio: "", stock: "0" },
              ])
            }
          >
            <span aria-hidden>+</span> Añadir variante
          </Button>
        </div>
      </div>
    </Panel>
  );
}
