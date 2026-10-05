"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  BOTON_PRIMARIO,
  BOTON_SECUNDARIO,
  Campo,
  Input,
  MensajeAccion,
  Select,
  Textarea,
} from "@/components/admin/campos";
import type { Categoria } from "@/lib/db/types";
import type { AdminActionState } from "@/lib/admin/tipos";
import { slugify } from "@/lib/admin/imagen";

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={BOTON_PRIMARIO}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

/**
 * Formulario de categoría.
 *
 * Dos restricciones que vienen del esquema y conviene no dejar de lado:
 *
 * - Solo se admite un nivel de anidamiento. Es lo que asume
 *   `getCategoriasJerarquicas()` en `lib/db/categorias.ts`, así que el `<select>`
 *   de padre solo ofrece categorías raíz.
 * - En edición, la categoría queda fuera de su propia lista de padres para que
 *   no se pueda elegir a sí misma. La RPC lo rechaza igualmente, pero es mejor
 *   no ofrecer la opción.
 */
export default function CategoriaForm({
  accion,
  categorias,
  categoria,
  submitText,
}: {
  accion: (
    estado: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  categorias: Categoria[];
  categoria?: Categoria;
  submitText: string;
}) {
  const [estado, enviarAccion] = useActionState(accion, {});

  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [slug, setSlug] = useState(categoria?.slug ?? "");
  const slugTocado = useRef(Boolean(categoria));

  useEffect(() => {
    if (!slugTocado.current) setSlug(slugify(nombre));
  }, [nombre]);

  const raices = categorias.filter(
    (c) => !c.parent_id || c.id === categoria?.id,
  );

  return (
    <form action={enviarAccion} className="flex flex-col gap-5">
      {categoria ? (
        <input type="hidden" name="id" value={categoria.id} />
      ) : null}

      <MensajeAccion success={estado.success} error={estado.error} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre" htmlFor="nombre" requerido>
          <Input
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Dragon Ball"
          />
        </Campo>

        <Campo
          etiqueta="Identificador (slug)"
          htmlFor="slug"
          requerido
          ayuda="Es la URL de la categoría. Único entre categorías del mismo nivel."
        >
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              slugTocado.current = true;
              setSlug(e.target.value);
            }}
            required
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Categoría padre"
        htmlFor="parent_id"
        ayuda="Solo se admite un nivel de anidamiento, el que usa el menú de la tienda."
      >
        <Select
          id="parent_id"
          name="parent_id"
          defaultValue={categoria?.parent_id ?? ""}
        >
          <option value="">Sin categoría padre (principal)</option>
          {raices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo etiqueta="Descripción" htmlFor="descripcion">
        <Textarea
          id="descripcion"
          name="descripcion"
          defaultValue={categoria?.descripcion ?? ""}
          rows={4}
        />
      </Campo>

      <Campo
        etiqueta="URL de la imagen"
        htmlFor="image_url"
        ayuda="Debe estar alojada en el bucket de Supabase. Una URL externa no la optimizes porque no está en los host permitidos de next.config.ts."
      >
        <Input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={categoria?.image_url ?? ""}
          placeholder="https://…supabase.co/storage/v1/object/public/productos/…"
        />
      </Campo>

      <div className="flex items-center gap-3">
        <Guardar texto={submitText} />
        <Link href="/admin/categorias" className={BOTON_SECUNDARIO}>
          Volver
        </Link>
      </div>
    </form>
  );
}
