"use server";

import { getAdminContext, mensajeError } from "@/lib/admin/auth";
import {
  parseTags,
  pathDesdeUrl,
  rutaObjetoImagen,
  slugify,
  tokenAleatorio,
  urlPublicaImagen,
  validarArchivo,
} from "@/lib/admin/imagen";
import type { AdminActionState } from "@/lib/admin/tipos";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Un módulo "use server" solo puede exportar funciones async: re-exportar un
// tipo rompe el manifiesto de actions. `AdminActionState` se importa desde
// `@/lib/admin/tipos`, que es donde vive.

function texto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function entero(formData: FormData, campo: string): number {
  const n = Number.parseInt(texto(formData, campo), 10);
  return Number.isFinite(n) ? n : 0;
}

function decimal(formData: FormData, campo: string): number | null {
  const bruto = texto(formData, campo).replace(",", ".");
  if (!bruto) return null;
  const n = Number.parseFloat(bruto);
  return Number.isFinite(n) ? n : null;
}

function booleano(formData: FormData, campo: string): boolean {
  return formData.get(campo) === "on" || formData.get(campo) === "true";
}

/** Revalida todo lo que depende del catálogo, no solo la ruta actual. */
function revalidarCatalogo() {
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/productos/nuevo");
  revalidatePath("/", "layout");
}

function revalidarProducto(id: string) {
  revalidarCatalogo();
  revalidatePath(`/admin/productos/${id}`);
  // La ficha pública usa el slug, no el id, así que la ruta no cambia. Lo que
  // sí cambia es `/search` y la portada, ya revalidadas arriba.
}

// ============================================================================
// Producto
// ============================================================================

export async function crearProducto(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const titulo = texto(formData, "titulo");
  if (!titulo) return { error: "El título del producto es obligatorio." };

  // El slug se calcula en el servidor aunque el campo venga vacío: si el
  // formulario propone uno distinto, manda el campo; si no, se deriva del título.
  const slugPropuesto = texto(formData, "slug");
  const slug = slugPropuesto || slugify(titulo);
  if (!slug) {
    return {
      error:
        "No se ha podido generar el identificador. Escribe uno con letras minúsculas, números y guiones.",
    };
  }

  const precio = decimal(formData, "precio");
  if (precio === null) return { error: "Indica el precio del producto." };
  if (precio < 0) return { error: "El precio no puede ser negativo." };

  const { data, error } = await ctx.supabase.rpc("admin_producto_create", {
    p_titulo: titulo,
    p_slug: slug,
    p_descripcion: texto(formData, "descripcion") || null,
    p_precio: precio,
    p_categoria_id: texto(formData, "categoria_id") || null,
    p_status: texto(formData, "status") || "stock",
    p_stock: entero(formData, "stock"),
    p_destacado: booleano(formData, "destacado"),
    p_sku: texto(formData, "sku") || null,
    p_tags: parseTags(texto(formData, "tags")),
  });

  if (error) {
    return {
      error: mensajeError(error) ?? "No se ha podido crear el producto.",
    };
  }

  revalidarCatalogo();
  // El alta no se queda en el formulario: lleva al editor, que es donde se
  // suben las imágenes. El producto tiene que existir para tener carpeta.
  redirect(`/admin/productos/${String(data)}`);
}

export async function actualizarProducto(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const id = texto(formData, "id");
  if (!id) return { error: "No se ha identificado el producto." };

  const titulo = texto(formData, "titulo");
  if (!titulo) return { error: "El título del producto es obligatorio." };

  const precio = decimal(formData, "precio");
  if (precio === null) return { error: "Indica el precio del producto." };

  const { error } = await ctx.supabase.rpc("admin_producto_update", {
    p_id: id,
    p_titulo: titulo,
    // El slug solo se reescribe si el campo viene informado. Regenerarlo en cada
    // guardado rompería las URLs ya publicadas.
    p_slug: texto(formData, "slug") || null,
    p_descripcion: texto(formData, "descripcion") || null,
    p_precio: precio,
    p_categoria_id: texto(formData, "categoria_id") || null,
    p_status: texto(formData, "status") || "stock",
    p_stock: entero(formData, "stock"),
    p_destacado: booleano(formData, "destacado"),
    p_sku: texto(formData, "sku") || null,
    p_tags: parseTags(texto(formData, "tags")),
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido guardar." };
  }

  revalidarProducto(id);
  return { success: "Producto guardado." };
}

/**
 * Elimina un producto.
 *
 * La RPC devuelve las rutas de Storage que hay que limpiar y deja
 * `items_pedido` intacto a propósito: los snapshots de un pedido deben seguir
 * siendo legibles aunque el producto desaparezca del catálogo.
 *
 * El borrado en Storage va DESPUÉS de la RPC a propósito. Si fallara antes, el
 * producto se quedaría sin foto; si falla después, solo queda un objeto huérfano
 * en el bucket, que es un problema de almacenamiento y no de datos.
 */
export async function eliminarProducto(id: string): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { data, error } = await ctx.supabase.rpc("admin_producto_delete", {
    p_id: id,
  });

  if (error) {
    return { error: mensajeError(error) ?? "No se ha podido eliminar." };
  }

  const rutas = (data as string[] | null) ?? [];
  if (rutas.length > 0) {
    const { error: errorStorage } = await ctx.supabase.storage
      .from("productos")
      .remove(rutas);

    if (errorStorage) {
      console.error(
        `[admin] borrada la fila pero no el objeto: ${rutas.join(", ")} - ${errorStorage.message}`,
      );
    }
  }

  revalidarCatalogo();
  redirect("/admin/productos");
}

export async function alternarDestacado(
  id: string,
  destacado: boolean,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase.rpc("admin_producto_set_destacado", {
    p_id: id,
    p_destacado: destacado,
  });

  if (error)
    return { error: mensajeError(error) ?? "No se ha podido guardar." };

  revalidarCatalogo();
  return {
    success: destacado ? "Producto destacado." : "Ya no está destacado.",
  };
}

export async function ajustarStock(
  id: string,
  stock: number,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "El stock debe ser un número entero mayor o igual que 0." };
  }

  const { error } = await ctx.supabase.rpc("admin_producto_set_stock", {
    p_id: id,
    p_stock: stock,
  });

  if (error)
    return { error: mensajeError(error) ?? "No se ha podido guardar." };

  revalidarCatalogo();
  return { success: `Stock ajustado a ${stock}.` };
}

// ============================================================================
// Imágenes
// ============================================================================

/**
 * Sube imágenes de un producto ya existente.
 *
 * El orden importa y no es casualidad:
 *   1. el producto tiene que existir, porque de su id se deriva la carpeta;
 *   2. la ruta la genera el servidor a partir del MIME validado, nunca del
 *      `File.name` del cliente;
 *   3. solo cuando el objeto está subido se inserta la fila, para no dejar
 *      referencias a imágenes que no existen.
 *
 * Se usa el cliente de servidor porque es el único que lleva la sesión del
 * admin y por tanto el único que pasa las policies de `storage.objects`.
 */
export async function subirImagenes(
  productoId: string,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const archivos = formData
    .getAll("archivos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (archivos.length === 0) {
    return { error: "Selecciona al menos una imagen." };
  }

  const bucket = ctx.supabase.storage.from("productos");
  const errores: string[] = [];

  for (const archivo of archivos) {
    const validacion = validarArchivo(archivo);
    if (!validacion.ok) {
      errores.push(`${archivo.name}: ${validacion.error}`);
      continue;
    }

    const path = rutaObjetoImagen(productoId, archivo.type, tokenAleatorio());

    const { error: errorSubida } = await bucket.upload(path, archivo, {
      contentType: archivo.type,
      upsert: false,
    });

    if (errorSubida) {
      errores.push(`No se ha podido subir ${archivo.name}.`);
      continue;
    }

    const { error: errorFila } = await ctx.supabase.rpc("admin_imagen_add", {
      p_producto_id: productoId,
      p_url: urlPublicaImagen(path),
      p_alt_text: texto(formData, "alt_text") || null,
    });

    if (errorFila) {
      // La subida funcionó pero la fila no: limpiamos el objeto para no dejar
      // un archivo huérfano que ocupa espacio y no se puede borrar desde el panel.
      await bucket.remove([path]);
      errores.push(`No se ha podido registrar ${archivo.name}.`);
    }
  }

  revalidarProducto(productoId);

  if (errores.length > 0) {
    return { error: errores.join(" ") };
  }

  return {
    success:
      archivos.length === 1
        ? "Imagen subida."
        : `${archivos.length} imágenes subidas.`,
  };
}

export async function eliminarImagen(
  productoId: string,
  imagenId: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { data, error } = await ctx.supabase.rpc("admin_imagen_delete", {
    p_imagen_id: imagenId,
  });

  if (error) return { error: mensajeError(error) ?? "No se ha podido borrar." };

  const path = typeof data === "string" ? pathDesdeUrl(data) : null;
  if (path) {
    const { error: errorStorage } = await ctx.supabase.storage
      .from("productos")
      .remove([path]);

    if (errorStorage) {
      console.error(
        `[admin] borrada la fila pero no el objeto: ${path} - ${errorStorage.message}`,
      );
    }
  }

  revalidarProducto(productoId);
  return { success: "Imagen eliminada." };
}

export async function reordenarImagenes(
  productoId: string,
  ids: string[],
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  if (ids.length === 0) return { error: "No hay imágenes que ordenar." };

  const { error } = await ctx.supabase.rpc("admin_imagen_reordenar", {
    p_producto_id: productoId,
    p_ids: ids,
  });

  if (error)
    return { error: mensajeError(error) ?? "No se ha podido guardar." };

  revalidarProducto(productoId);
  return { success: "Orden guardado." };
}

export async function editarAltImagen(
  productoId: string,
  imagenId: string,
  altText: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  const { error } = await ctx.supabase.rpc("admin_imagen_set_alt", {
    p_imagen_id: imagenId,
    p_alt_text: altText.trim(),
  });

  if (error)
    return { error: mensajeError(error) ?? "No se ha podido guardar." };

  revalidarProducto(productoId);
  return { success: "Texto alternativo guardado." };
}

// ============================================================================
// Variantes
// ============================================================================

/**
 * Guarda todas las variantes de golpe.
 *
 * Recibe un array de filas en un único campo JSON en lugar de N campos
 * `<name="titulo">` porque el formulario es dinámico: con `FormData` plano no se
 * puede saber a qué variante pertenece cada valor al llegar al servidor.
 */
export async function guardarVariantes(
  productoId: string,
  filasJson: string,
): Promise<AdminActionState> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { error: ctx.error };

  let filas: unknown;
  try {
    filas = JSON.parse(filasJson);
  } catch {
    return { error: "No se ha podido leer el formulario de variantes." };
  }

  if (!Array.isArray(filas)) {
    return {
      error: "El formulario de variantes no tiene el formato correcto.",
    };
  }

  const validas = filas.filter(
    (
      f,
    ): f is {
      id?: string | null;
      titulo: string;
      precio: number;
      stock: number;
      sku?: string;
      opciones?: unknown[];
    } =>
      typeof f === "object" &&
      f !== null &&
      typeof (f as { titulo?: unknown }).titulo === "string" &&
      (f as { titulo: string }).titulo.trim() !== "",
  );

  const errores: string[] = [];

  for (const fila of validas) {
    const opciones = Array.isArray(fila.opciones)
      ? fila.opciones.filter(
          (o): o is { name: string; value: string } =>
            typeof o === "object" &&
            o !== null &&
            typeof (o as { name?: unknown }).name === "string" &&
            typeof (o as { value?: unknown }).value === "string",
        )
      : [];

    const { error } = await ctx.supabase.rpc("admin_variante_upsert", {
      p_producto_id: productoId,
      p_titulo: fila.titulo.trim(),
      p_precio: Number(fila.precio) || 0,
      p_stock: Number.isFinite(Number(fila.stock)) ? Number(fila.stock) : 0,
      p_sku:
        typeof fila.sku === "string" && fila.sku.trim()
          ? fila.sku.trim()
          : null,
      p_opciones: opciones,
      p_id: fila.id && fila.id !== "nuevo" ? fila.id : null,
    });

    if (error)
      errores.push(mensajeError(error) ?? `Variante «${fila.titulo}».`);
  }

  // Las que estaban en el formulario y el usuario ha quitado se borran.
  const idsEnviados = new Set(
    validas
      .map((f) => f.id)
      .filter((id): id is string => Boolean(id) && id !== "nuevo"),
  );

  const { data: existentes } = await ctx.supabase
    .from("producto_variantes")
    .select("id")
    .eq("producto_id", productoId);

  for (const fila of existentes ?? []) {
    if (idsEnviados.has(fila.id)) continue;

    const { error } = await ctx.supabase.rpc("admin_variante_delete", {
      p_id: fila.id,
    });

    if (error) errores.push("No se ha podido eliminar una variante.");
  }

  revalidarProducto(productoId);

  if (errores.length > 0) return { error: errores.join(" ") };

  return { success: "Variantes guardadas." };
}
