"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveCategoria } from "@/app/admin/actions/categorias";
import type { AdminActionState } from "@/app/admin/actions/productos";
import { Button } from "@/components/admin/ui/button";
import { Field, inputClass } from "@/components/admin/ui/form";
import { slugify } from "@/lib/admin/storage";
import type { Categoria } from "@/lib/db/types";

export type CategoriaFormValues = {
  id?: string;
  nombre: string;
  slug: string;
  descripcion: string;
  image_url: string;
  parent_id: string;
  orden_cat: string;
};

export const CATEGORIA_VACIA: CategoriaFormValues = {
  nombre: "",
  slug: "",
  descripcion: "",
  image_url: "",
  parent_id: "",
  orden_cat: "0",
};

export function CategoryForm({
  values,
  padres,
  submitLabel,
}: {
  values: CategoriaFormValues;
  /** Ya viene filtrada: excluye la propia categoría y todo su subárbol. */
  padres: Categoria[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    saveCategoria,
    {},
  );

  const [nombre, setNombre] = useState(values.nombre);
  const [slug, setSlug] = useState(values.slug);
  const [slugEditado, setSlugEditado] = useState(Boolean(values.slug));

  const errores = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <Field label="Nombre" htmlFor="nombre" required error={errores.nombre}>
        <input
          id="nombre"
          name="nombre"
          className={inputClass}
          value={nombre}
          onChange={(event) => {
            setNombre(event.target.value);
            if (!slugEditado) setSlug(slugify(event.target.value));
          }}
          required
          minLength={2}
          maxLength={120}
        />
      </Field>

      <Field
        label="Slug (URL)"
        htmlFor="slug"
        error={errores.slug}
        hint="Se genera del nombre. Es la URL de la categoría en la tienda."
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

      <Field
        label="Categoría superior"
        htmlFor="parent_id"
        error={errores.parent_id}
        hint="Déjalo en «Ninguna» para que sea una categoría de primer nivel."
      >
        <select
          id="parent_id"
          name="parent_id"
          className={inputClass}
          defaultValue={values.parent_id}
        >
          <option value="">Ninguna (primer nivel)</option>
          {padres.map((padre) => (
            <option key={padre.id} value={padre.id}>
              {padre.nombre}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Orden"
        htmlFor="orden_cat"
        hint="Menor número = aparece antes en el menú."
      >
        <input
          id="orden_cat"
          name="orden_cat"
          type="number"
          min={0}
          step={1}
          className={inputClass}
          defaultValue={values.orden_cat}
        />
      </Field>

      <Field label="URL de imagen" htmlFor="image_url">
        <input
          id="image_url"
          name="image_url"
          type="url"
          className={inputClass}
          defaultValue={values.image_url}
          placeholder="https://…"
        />
      </Field>

      <Field label="Descripción" htmlFor="descripcion">
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          className={inputClass}
          defaultValue={values.descripcion}
        />
      </Field>

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
          href="/admin/categorias"
          className="text-sm text-neutral-600 hover:underline dark:text-neutral-300"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
