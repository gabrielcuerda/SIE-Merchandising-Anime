"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  BOTON_PELIGRO,
  BOTON_SECUNDARIO,
  Campo,
  Input,
  MensajeAccion,
} from "@/components/admin/campos";
import {
  editarAltImagen,
  eliminarImagen,
  reordenarImagenes,
  subirImagenes,
} from "@/app/admin/productos/actions";
import { MIME_PERMITIDOS, TAMANO_MAXIMO_BYTES } from "@/lib/admin/imagen";
import type { AdminActionState } from "@/lib/admin/tipos";

type Imagen = {
  id: string;
  url: string;
  alt_text: string | null;
  orden_cat: number;
};

/**
 * Gestión de imágenes de un producto.
 *
 * El `File` se envía al Server Action tal cual, con su `name` y su `type`
 * declarados por el navegador. El servidor no confía en ninguno de los dos:
 * vuelve a validar MIME y tamaño (`validarArchivo`) y genera la ruta del
 * objeto a partir del id del producto y del MIME validado
 * (`rutaObjetoImagen`). El bucket aplica una tercera capa con
 * `allowed_mime_types` y `file_size_limit`.
 *
 * Aquí abajo solo se valida para dar feedback inmediato, sin esperar al
 * servidor.
 */
export default function ProductoImagenes({
  productoId,
  imagenes,
}: {
  productoId: string;
  imagenes: Imagen[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [pendiente, iniciarTransicion] = useTransition();
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<AdminActionState>({});
  const [seleccion, setSeleccion] = useState<File[]>([]);

  // Las imágenes llegan ordenadas por `orden_cat`; la primera es la portada.
  const ordenadas = [...imagenes].sort((a, b) => a.orden_cat - b.orden_cat);

  const comprobarArchivos = (archivos: File[]) => {
    for (const archivo of archivos) {
      if (!MIME_PERMITIDOS.includes(archivo.type)) {
        toast.error(
          `«${archivo.name}» no es un formato admitido. Usa PNG, JPEG, WebP, AVIF o GIF.`,
        );
        return false;
      }

      if (archivo.size > TAMANO_MAXIMO_BYTES) {
        toast.error(
          `«${archivo.name}» pesa ${(archivo.size / 1048576).toFixed(1)} MB y el máximo son 5 MB.`,
        );
        return false;
      }
    }

    return true;
  };

  const enviar = () => {
    if (!formRef.current) return;
    if (seleccion.length === 0) return;

    setSubiendo(true);
    setMensaje({});

    const datos = new FormData(formRef.current);
    for (const archivo of seleccion) datos.append("archivos", archivo);

    // `enviarImagenes` es la action; se llama directamente para poder añadir los
    // archivos al FormData que el `<form>` ya tiene.
    const promesa = subirImagenes(productoId, datos);

    promesa
      .then((resultado) => {
        setMensaje(resultado);
        setSeleccion([]);
        if (formRef.current) formRef.current.reset();
        if (resultado.error) toast.error(resultado.error);
        else toast.success(resultado.success ?? "Listo.");
        router.refresh();
      })
      .catch(() => {
        toast.error("No se han podido subir las imágenes.");
      })
      .finally(() => setSubiendo(false));
  };

  const mover = (indice: number, delta: number) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= ordenadas.length) return;

    const nuevo = [...ordenadas];
    const movido = nuevo[indice];
    const ocupando = nuevo[destino];
    if (!movido || !ocupando) return;

    nuevo[indice] = ocupando;
    nuevo[destino] = movido;

    iniciarTransicion(async () => {
      const resultado = await reordenarImagenes(
        productoId,
        nuevo.map((i) => i.id),
      );

      if (resultado.error) toast.error(resultado.error);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {ordenadas.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ordenadas.map((imagen, indice) => (
            <li
              key={imagen.id}
              className="flex flex-col gap-2 rounded-card border border-ink-200 bg-white p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-card bg-ink-50">
                <Image
                  src={imagen.url}
                  alt={imagen.alt_text ?? "Imagen del producto"}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {indice === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Portada
                  </span>
                ) : null}
              </div>

              <Input
                defaultValue={imagen.alt_text ?? ""}
                placeholder="Texto alternativo"
                aria-label={`Texto alternativo de la imagen ${indice + 1}`}
                onBlur={(e) => {
                  if (e.target.value === (imagen.alt_text ?? "")) return;
                  iniciarTransicion(async () => {
                    const resultado = await editarAltImagen(
                      productoId,
                      imagen.id,
                      e.target.value,
                    );
                    if (resultado.error) toast.error(resultado.error);
                    router.refresh();
                  });
                }}
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pendiente || indice === 0}
                  onClick={() => mover(indice, -1)}
                  className="rounded-card px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={pendiente || indice === ordenadas.length - 1}
                  onClick={() => mover(indice, 1)}
                  className="rounded-card px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "¿Eliminar esta imagen? Se borrará también el archivo del almacenamiento.",
                      )
                    ) {
                      return;
                    }

                    iniciarTransicion(async () => {
                      const resultado = await eliminarImagen(
                        productoId,
                        imagen.id,
                      );
                      if (resultado.error) toast.error(resultado.error);
                      else toast.success("Imagen eliminada.");
                      router.refresh();
                    });
                  }}
                  className="ml-auto rounded-card px-2 py-1 text-xs font-semibold text-alert-700 hover:bg-alert-50 disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card border border-dashed border-ink-300 bg-ink-50/50 px-4 py-8 text-center text-sm text-ink-500">
          Este producto aún no tiene imágenes.
        </p>
      )}

      <form
        ref={formRef}
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar();
        }}
        className="flex flex-col gap-4 rounded-card border border-ink-200 bg-ink-50/60 p-4"
      >
        <MensajeAccion success={mensaje.success} error={mensaje.error} />

        <Campo
          etiqueta="Añadir imágenes"
          htmlFor="archivos"
          ayuda={`Hasta 5 MB por archivo. Formatos: ${MIME_PERMITIDOS.map((m) =>
            m.replace("image/", "").toUpperCase(),
          ).join(", ")}. La primera será la portada.`}
        >
          <input
            id="archivos"
            type="file"
            name="archivos"
            multiple
            accept={MIME_PERMITIDOS.join(",")}
            onChange={(e) => {
              const archivos = Array.from(e.target.files ?? []);
              if (archivos.length === 0) {
                setSeleccion([]);
                return;
              }
              if (!comprobarArchivos(archivos)) {
                setSeleccion([]);
                e.target.value = "";
                return;
              }
              setSeleccion(archivos);
            }}
            className="w-full rounded-card border border-ink-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-card file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700"
          />
        </Campo>

        <Campo
          etiqueta="Texto alternativo"
          htmlFor="alt_text"
          ayuda="Se aplica a las imágenes de esta subida. Se puede corregir después una a una."
        >
          <Input
            id="alt_text"
            name="alt_text"
            placeholder="Figura de Goku y Gohan en su forma Beast"
          />
        </Campo>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={subiendo || seleccion.length === 0}
            className={BOTON_SECUNDARIO}
          >
            {subiendo
              ? "Subiendo…"
              : seleccion.length > 0
                ? `Subir ${seleccion.length} ${seleccion.length === 1 ? "imagen" : "imágenes"}`
                : "Selecciona archivos"}
          </button>
        </div>
      </form>
    </div>
  );
}
