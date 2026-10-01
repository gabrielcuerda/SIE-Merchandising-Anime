"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  deleteProductImage,
  deleteProducto,
  moveProductImage,
  updateProductImageAlt,
  uploadProductImage,
} from "@/app/admin/actions/productos";
import { Button } from "@/components/admin/ui/button";
import { inputClass } from "@/components/admin/ui/form";
import {
  IMAGE_MIME_PERMITIDOS,
  MAX_IMAGE_BYTES,
} from "@/lib/admin/storage";
import type { ProductoImagen } from "@/lib/db/types";

const ACCEPT = IMAGE_MIME_PERMITIDOS.join(",");

/**
 * Gestión de imágenes del producto: arrastrar y soltar, previsualización,
 * reordenado y borrado.
 *
 * La subida va contra una Server Action (no contra el bucket directamente):
 * así el bucket nunca expone credenciales al navegador y el MIME/tamaño se
 * validan en el servidor, no solo en el `<input type="file">`.
 */
export function ImageUploader({
  productoId,
  imagenes,
}: {
  productoId: string;
  imagenes: ProductoImagen[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [pending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);

  const ordenadas = [...imagenes].sort((a, b) => a.orden_cat - b.orden_cat);

  const subir = (archivo: File) => {
    setError(null);
    setExito(null);

    if (!IMAGE_MIME_PERMITIDOS.includes(archivo.type)) {
      setError(
        `Formato no admitido (${archivo.type || "desconocido"}). Usa JPG, PNG, WebP o AVIF.`,
      );
      return;
    }

    if (archivo.size > MAX_IMAGE_BYTES) {
      setError(
        `La imagen pesa ${(archivo.size / 1024 / 1024).toFixed(
          1,
        )} MB y el máximo es 5 MB.`,
      );
      return;
    }

    const formData = new FormData();
    formData.set("producto_id", productoId);
    formData.set("archivo", archivo);
    formData.set("alt_text", altRef.current?.value ?? "");

    startTransition(async () => {
      try {
        const resultado = await uploadProductImage(formData);

        if (resultado.error) {
          setError(resultado.error);
        } else {
          setExito("Imagen subida.");
          if (inputRef.current) inputRef.current.value = "";
          if (altRef.current) altRef.current.value = "";
        }
      } catch {
        setError("No hemos podido subir la imagen. Inténtalo de nuevo.");
      }
    });
  };

  const alSoltar = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setArrastrando(false);

    const archivo = event.dataTransfer.files?.[0];
    if (archivo) subir(archivo);
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      {ordenadas.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordenadas.map((imagen, index) => (
            <li
              key={imagen.id}
              className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800"
            >
              <div className="relative aspect-square bg-white dark:bg-neutral-950">
                <Image
                  src={imagen.url}
                  alt={imagen.alt_text ?? `Imagen ${index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 100vw"
                  className="object-contain"
                />
                {index === 0 ? (
                  <span className="absolute top-2 left-2 rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                    Portada
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 p-3">
                <input
                  type="text"
                  defaultValue={imagen.alt_text ?? ""}
                  placeholder="Texto alternativo"
                  aria-label={`Texto alternativo de la imagen ${index + 1}`}
                  className={`${inputClass} py-1.5 text-xs`}
                  onBlur={(event) => {
                    if (event.target.value !== (imagen.alt_text ?? "")) {
                      startTransition(() => {
                        void updateProductImageAlt(
                          imagen.id,
                          productoId,
                          event.target.value,
                        );
                      });
                    }
                  }}
                />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Subir la imagen ${index + 1}`}
                    disabled={index === 0 || pending}
                    onClick={() =>
                      startTransition(() => {
                        void moveProductImage(imagen.id, productoId, index - 1);
                      })
                    }
                    className="rounded p-1.5 text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <ArrowUpIcon aria-hidden className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Bajar la imagen ${index + 1}`}
                    disabled={index === ordenadas.length - 1 || pending}
                    onClick={() =>
                      startTransition(() => {
                        void moveProductImage(imagen.id, productoId, index + 1);
                      })
                    }
                    className="rounded p-1.5 text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <ArrowDownIcon aria-hidden className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Eliminar la imagen ${index + 1}`}
                    disabled={pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "¿Eliminar esta imagen? La acción no se puede deshacer.",
                        )
                      ) {
                        return;
                      }
                      startTransition(() => {
                        void deleteProductImage(imagen.id, productoId);
                      });
                    }}
                    className="ml-auto rounded p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-30 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <TrashIcon aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Este producto aún no tiene imágenes.
        </p>
      )}

      <div className="rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
        <label
          htmlFor="alt_text"
          className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          Texto alternativo
        </label>
        <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
          Describe la imagen para quien usa lector de pantalla. Se aplica a la
          siguiente imagen que subas.
        </p>
        <input
          id="alt_text"
          ref={altRef}
          className={inputClass}
          placeholder="Figura de Luffy con su sombrero de paja"
        />

        <label
          htmlFor="archivo"
          onDragOver={(event) => {
            event.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
          className={`mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-6 text-center transition ${
            arrastrando
              ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
              : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700"
          }`}
        >
          <PhotoIcon aria-hidden className="h-6 w-6 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Arrastra una imagen o haz clic para elegir
          </span>
          <span className="text-xs text-neutral-500">
            JPG, PNG, WebP o AVIF · máximo 5 MB
          </span>
          <input
            id="archivo"
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              const archivo = event.target.files?.[0];
              if (archivo) subir(archivo);
            }}
          />
        </label>

        {pending ? (
          <p role="status" className="mt-3 text-sm text-neutral-500">
            Subiendo imagen...
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        {exito ? (
          <p role="status" className="mt-3 text-sm text-green-700">
            {exito}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Botón de borrado con confirmación y mensaje de error en línea. */
export function DeleteProductButton({
  productoId,
  titulo,
}: {
  productoId: string;
  titulo: string;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        variant="danger"
        onClick={async () => {
          if (
            !window.confirm(
              `¿Eliminar "${titulo}"? Se borrarán sus imágenes y variantes. Esta acción no se puede deshacer.`,
            )
          ) {
            return;
          }

          setError(null);

          const formData = new FormData();
          formData.set("id", productoId);

          try {
            const resultado = await deleteProducto({}, formData);

            if (resultado.error) {
              setError(resultado.error);
            }
          } catch {
            setError("No hemos podido eliminar el producto.");
          }
        }}
      >
        Eliminar producto
      </Button>

      {error ? (
        <p role="alert" className="mt-2 max-w-md text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
