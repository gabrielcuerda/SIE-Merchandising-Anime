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

function Guardar({ texto = "Guardar" }: { texto?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={BOTON_PRIMARIO}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

/**
 * Formulario de producto, compartido por el alta y la edición.
 *
 * Dos detalles que merecen explicación:
 *
 * 1. El slug se sugiere a partir del título, pero solo mientras el campo esté
 *    "virginial". En cuanto el usuario lo edita a mano deja de sobrescribirse: si
 *    no, cualquier cambio en el título rompería la URL publicada.
 *
 * 2. El campo de precio dice explícitamente "sin IVA". `productos.precio` no
 *    incluye el 21 %, que se aplica en el checkout (`IVA_PORCENTAJE` en
 *    `lib/constants.ts`). Es el error de cálculo más fácil de cometer aquí.
 */
export default function ProductoForm({
  accion,
  categorias,
  producto,
  slugsUsados,
  submitText = "Guardar",
}: {
  accion: (
    estado: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  categorias: Categoria[];
  producto?: {
    id: string;
    titulo: string;
    slug: string;
    descripcion: string | null;
    precio: number;
    categoria_id: string | null;
    status: "stock" | "pre-venta" | "a-pedido" | "oferta";
    stock: number;
    destacado: boolean;
    sku: string | null;
    tags: string[] | null;
  };
  slugsUsados: Set<string>;
  submitText?: string;
}) {
  const [estado, enviarAccion] = useActionState(accion, {});

  const [titulo, setTitulo] = useState(producto?.titulo ?? "");
  const [slug, setSlug] = useState(producto?.slug ?? "");
  const slugTocado = useRef(Boolean(producto));

  // Mientras el slug no se haya tocado a mano, se deriva del título.
  useEffect(() => {
    if (!slugTocado.current) setSlug(slugify(titulo));
  }, [titulo]);

  const esNuevo = !producto;

  const slugDuplicado = slug.length > 0 && slugsUsados.has(slug);

  return (
    <form action={enviarAccion} className="flex flex-col gap-6">
      {producto ? <input type="hidden" name="id" value={producto.id} /> : null}

      <MensajeAccion success={estado.success} error={estado.error} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo
          etiqueta="Título"
          htmlFor="titulo"
          requerido
          className="sm:col-span-2"
        >
          <Input
            id="titulo"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            placeholder="Goku & Gohan Beast Vjump Exclusive"
          />
        </Campo>

        <Campo
          etiqueta="Identificador (slug)"
          htmlFor="slug"
          requerido
          ayuda={
            slugDuplicado
              ? "Ya hay otro producto con este identificador."
              : "Se genera a partir del título. Es la URL pública del producto: cámbialo solo si el producto aún no se ha publicado."
          }
          error={slugDuplicado ? "Identificador duplicado." : null}
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

        <Campo etiqueta="SKU" htmlFor="sku" ayuda="Opcional. Código interno.">
          <Input
            id="sku"
            name="sku"
            defaultValue={producto?.sku ?? ""}
            placeholder="DBZ-VJ-001"
          />
        </Campo>
      </div>

      <Campo etiqueta="Descripción" htmlFor="descripcion">
        <Textarea
          id="descripcion"
          name="descripcion"
          defaultValue={producto?.descripcion ?? ""}
          rows={5}
          placeholder="Describe el producto: material, tamaño, edición…"
        />
      </Campo>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Campo
          etiqueta="Precio (sin IVA)"
          htmlFor="precio"
          requerido
          ayuda="El 21 % de IVA se aplica en el pago, no aquí."
        >
          <Input
            id="precio"
            name="precio"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={producto ? String(producto.precio) : ""}
          />
        </Campo>

        <Campo
          etiqueta="Stock"
          htmlFor="stock"
          ayuda="Solo se descuenta si el estado es «En stock»."
        >
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={producto ? String(producto.stock) : "0"}
          />
        </Campo>

        <Campo etiqueta="Estado" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={producto?.status ?? "stock"}
          >
            <option value="stock">En stock</option>
            <option value="pre-venta">Próximamente</option>
            <option value="a-pedido">Bajo pedido</option>
            <option value="oferta">Oferta</option>
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo etiqueta="Categoría" htmlFor="categoria_id">
          <Select
            id="categoria_id"
            name="categoria_id"
            defaultValue={producto?.categoria_id ?? ""}
          >
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo
          etiqueta="Etiquetas"
          htmlFor="tags"
          ayuda="Separadas por comas. Se usan en la búsqueda."
        >
          <Input
            id="tags"
            name="tags"
            defaultValue={producto?.tags?.join(", ") ?? ""}
            placeholder="vjump, exclusiva, dragon-ball"
          />
        </Campo>
      </div>

      <label className="flex items-start gap-3 rounded-card border border-ink-200 bg-ink-50/60 p-4">
        <input
          type="checkbox"
          name="destacado"
          defaultChecked={producto?.destacado ?? false}
          className="mt-0.5 size-4 rounded border-ink-300 text-brand-600"
        />
        <span>
          <span className="block text-sm font-semibold text-ink-900">
            Destacar en la portada
          </span>
          <span className="block text-xs text-ink-500">
            Los productos destacados aparecen en el carrusel de inicio. Solo
            diez caben bien: úsalo con cabeza.
          </span>
        </span>
      </label>

      {esNuevo ? (
        <p className="rounded-card border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
          Al guardar el producto podrás subirle las imágenes y sus variantes. El
          identificador se comprueba contra los productos existentes al guardar.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Guardar texto={submitText} />
        <Link href="/admin/productos" className={BOTON_SECUNDARIO}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
