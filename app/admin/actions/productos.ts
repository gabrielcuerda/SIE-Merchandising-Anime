"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  PRODUCTO_STATUS_VALUES,
  type ProductoStatus,
} from "@/lib/admin/constants";
import {
  BUCKET_PRODUCTOS,
  buildObjectPath,
  extensionFor,
  IMAGE_MIME_PERMITIDOS,
  MAX_IMAGE_BYTES,
  slugify,
} from "@/lib/admin/storage";
import { countPedidosDelProducto } from "@/lib/db/admin/productos";
import type { Producto, ProductoVariante } from "@/lib/db/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminAuthError, assertAdmin } from "@/lib/supabase/require-admin";

export type AdminActionState = {
  success?: string;
  error?: string;
  /** Errores por campo, para pintarlos junto al control. */
  fieldErrors?: Record<string, string>;
};

type Admin = SupabaseClient;

function getValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Acepta coma o punto decimal: los admins están en España. */
function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isProductoStatus(value: string): value is ProductoStatus {
  return (PRODUCTO_STATUS_VALUES as string[]).includes(value);
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function toErrorState(error: unknown, porDefecto: string): AdminActionState {
  if (error instanceof AdminAuthError || error instanceof Error) {
    return { error: error.message };
  }
  return { error: porDefecto };
}

// ============================================================================
// Producto
// ============================================================================

export async function saveProducto(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { admin } = await assertAdmin();

    const id = getValue(formData, "id");
    const fieldErrors: Record<string, string> = {};

    const titulo = getValue(formData, "titulo");
    if (titulo.length < 2) {
      fieldErrors.titulo = "El título debe tener al menos 2 caracteres.";
    }

    const slug = getValue(formData, "slug") || slugify(titulo);
    if (!slug) {
      fieldErrors.slug = "No se ha podido generar un slug a partir del título.";
    }

    const precio = toNumber(getValue(formData, "precio"));
    if (Number.isNaN(precio) || precio < 0) {
      fieldErrors.precio = "El precio debe ser un número mayor o igual que 0.";
    }

    const stock = toNumber(getValue(formData, "stock"));
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      fieldErrors.stock =
        "El stock debe ser un entero mayor o igual que 0.";
    }

    const status = getValue(formData, "status");
    if (!isProductoStatus(status)) {
      return {
        error: "Revisa los campos marcados.",
        fieldErrors: { status: "Selecciona un estado válido." },
      };
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { error: "Revisa los campos marcados.", fieldErrors };
    }

    const tags = getValue(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload: Partial<Producto> = {
      titulo,
      slug,
      descripcion: getValue(formData, "descripcion") || null,
      precio,
      stock,
      status,
      categoria_id: getValue(formData, "categoria_id") || null,
      destacado: formData.get("destacado") === "on",
      sku: getValue(formData, "sku") || null,
      // `tags` es un `text[]` de Postgres: se manda el array, no una cadena.
      tags: tags.length > 0 ? tags : null,
      updated_at: new Date().toISOString(),
    };

    let productoId = id;

    if (id) {
      const { error } = await admin.from("productos").update(payload).eq("id", id);
      if (error) {
        return {
          error: "No hemos podido guardar los cambios del producto.",
          fieldErrors: { slug: "Es posible que el slug ya esté en uso." },
        };
      }
    } else {
      const { data, error } = await admin
        .from("productos")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select("id")
        .single();

      if (error) {
        return {
          error: "No hemos podido crear el producto.",
          fieldErrors: { slug: "Es posible que el slug ya esté en uso." },
        };
      }

      productoId = data.id;
    }

    await sincronizarVariantes(admin, productoId, formData);

    revalidatePath("/", "layout");
    revalidatePath("/admin/productos");

    if (!id) {
      // Alta: el admin acaba de crear algo, lo llevamos a su ficha.
      redirect(`/admin/productos/${productoId}`);
    }

    revalidatePath(`/admin/productos/${productoId}`);

    return { success: "Producto guardado correctamente." };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return toErrorState(error, "No hemos podido guardar el producto.");
  }
}

/**
 * Borra el producto. Si tiene líneas de pedido se bloquea: el histórico de
 * ventas debe conservar la referencia, así que la opción correcta ahí es
 * cambiar el estado a "a pedido" o retirarlo del catálogo.
 */
export async function deleteProducto(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { admin } = await assertAdmin();
    const id = getValue(formData, "id");

    if (!id) return { error: "El producto no es válido." };

    const lineas = await countPedidosDelProducto(id);
    if (lineas > 0) {
      return {
        error:
          `No se puede eliminar: el producto aparece en ${lineas} línea${
            lineas === 1 ? "" : "s"
          } de pedido. Cambia su estado o stock para retirarlo del catálogo sin romper el histórico.`,
      };
    }

    const { data: imagenes } = await admin
      .from("producto_imagenes")
      .select("url")
      .eq("producto_id", id);

    const { error: errorImagenes } = await admin
      .from("producto_imagenes")
      .delete()
      .eq("producto_id", id);
    if (errorImagenes) {
      return { error: "No hemos podido eliminar las imágenes del producto." };
    }

    await admin.from("producto_variantes").delete().eq("producto_id", id);

    const { error } = await admin.from("productos").delete().eq("id", id);
    if (error) {
      return { error: "No hemos podido eliminar el producto." };
    }

    await borrarObjetosDeStorage(admin, (imagenes ?? []).map((i) => i.url));

    revalidatePath("/", "layout");
    revalidatePath("/admin/productos");

    return { success: "Producto eliminado." };
  } catch (error) {
    return toErrorState(error, "No hemos podido eliminar el producto.");
  }
}

// ============================================================================
// Variantes
// ============================================================================

type VarianteInput = {
  id: string;
  titulo: string;
  sku: string | null;
  precio: number;
  stock: number;
};

/**
 * Los inputs se nombran por índice, así que `getAll` devuelve las filas en el
 * mismo orden en que se renderizan. El índice es la única clave común entre
 * las cuatro columnas y entre las filas nuevas y las ya guardadas.
 */
function leerVariantes(formData: FormData): VarianteInput[] {
  const titulos = formData.getAll("variante_titulo").map(String);
  const ids = formData.getAll("variante_id").map(String);

  return titulos
    .map((titulo, index) => {
      const limpio = titulo.trim();
      if (!limpio) return null;

      return {
        id: (ids[index] ?? "").trim(),
        titulo: limpio,
        sku: getValue(formData, `variante_sku_${index}`) || null,
        precio: toNumber(getValue(formData, `variante_precio_${index}`)),
        stock: toNumber(getValue(formData, `variante_stock_${index}`)),
      } satisfies VarianteInput;
    })
    .filter((variante): variante is VarianteInput => variante !== null)
    .filter((variante) => !Number.isNaN(variante.precio) && !Number.isNaN(variante.stock));
}

/**
 * El formulario reenvía la lista completa de variantes, así que en lugar de
 * calcular un diff se sincroniza: se borra lo que desaparezca y se inserta o
 * actualiza lo que quede.
 */
async function sincronizarVariantes(
  admin: Admin,
  productoId: string,
  formData: FormData,
) {
  const deseadas = leerVariantes(formData);

  const { data: existentes } = await admin
    .from("producto_variantes")
    .select("id")
    .eq("producto_id", productoId);

  const idsExistentes = new Set((existentes ?? []).map((v) => v.id));
  const idsDeseados = new Set(deseadas.map((v) => v.id).filter(Boolean));
  const aBorrar = [...idsExistentes].filter((id) => !idsDeseados.has(id));

  if (aBorrar.length > 0) {
    await admin.from("producto_variantes").delete().in("id", aBorrar);
  }

  const nuevas = deseadas.filter((v) => !v.id);
  if (nuevas.length > 0) {
    await admin.from("producto_variantes").insert(
      nuevas.map((variante) => ({
        producto_id: productoId,
        titulo: variante.titulo,
        sku: variante.sku,
        precio: variante.precio,
        stock: variante.stock,
        opciones: [],
        created_at: new Date().toISOString(),
      })),
    );
  }

  const aActualizar = deseadas.filter((v) => v.id && idsExistentes.has(v.id));
  for (const variante of aActualizar) {
    await admin
      .from("producto_variantes")
      .update({
        titulo: variante.titulo,
        sku: variante.sku,
        precio: variante.precio,
        stock: variante.stock,
      })
      .eq("id", variante.id);
  }
}

// ============================================================================
// Imágenes
// ============================================================================

/** Sube una imagen al bucket y la registra en `producto_imagenes`. */
export async function uploadProductImage(formData: FormData) {
  const { admin } = await assertAdmin();

  const productoId = getValue(formData, "producto_id");
  const archivo = formData.get("archivo");

  if (!productoId) return { error: "El producto no es válido." };

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  if (!IMAGE_MIME_PERMITIDOS.includes(archivo.type)) {
    return {
      error: `Formato no admitido (${
        archivo.type || "desconocido"
      }). Usa JPG, PNG, WebP o AVIF.`,
    };
  }

  if (archivo.size > MAX_IMAGE_BYTES) {
    return {
      error: `La imagen pesa ${(archivo.size / 1024 / 1024).toFixed(
        1,
      )} MB y el máximo es 5 MB.`,
    };
  }

  const extension = extensionFor(archivo.type);
  if (!extension) return { error: "Formato no admitido." };

  const ruta = buildObjectPath(productoId, extension);
  const buffer = await archivo.arrayBuffer();

  const { error: errorSubida } = await admin.storage
    .from(BUCKET_PRODUCTOS)
    .upload(ruta, buffer, { contentType: archivo.type, upsert: false });

  if (errorSubida) {
    return { error: "No hemos podido subir la imagen. Inténtalo de nuevo." };
  }

  const { data: urlData } = admin.storage
    .from(BUCKET_PRODUCTOS)
    .getPublicUrl(ruta);
  const url = urlData.publicUrl;

  const { count } = await admin
    .from("producto_imagenes")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  const { error: errorInsert } = await admin.from("producto_imagenes").insert({
    producto_id: productoId,
    url,
    alt_text: getValue(formData, "alt_text") || null,
    orden_cat: count ?? 0,
  });

  if (errorInsert) {
    // No dejamos objetos huérfanos en el bucket.
    await admin.storage.from(BUCKET_PRODUCTOS).remove([ruta]);
    return { error: "No hemos podido registrar la imagen." };
  }

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/", "layout");

  return { success: url };
}

/** Elimina una imagen: primero la fila, después el objeto del bucket. */
export async function deleteProductImage(imageId: string, productoId: string) {
  const { admin } = await assertAdmin();

  const { data: imagen } = await admin
    .from("producto_imagenes")
    .select("url")
    .eq("id", imageId)
    .maybeSingle();

  const { error } = await admin
    .from("producto_imagenes")
    .delete()
    .eq("id", imageId);

  if (error) {
    throw new Error("No hemos podido eliminar la imagen.");
  }

  if (imagen?.url) {
    await borrarObjetosDeStorage(admin, [imagen.url]);
  }

  await reordenarImagenes(admin, productoId);

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/", "layout");
}

/**
 * Mueve una imagen a otra posición. `destino` es el índice visible (0-based).
 * La portada de la ficha es la de `orden_cat` 0, así que el orden importa.
 */
export async function moveProductImage(
  imageId: string,
  productoId: string,
  destino: number,
) {
  const { admin } = await assertAdmin();

  const { data: imagenes } = await admin
    .from("producto_imagenes")
    .select("id")
    .eq("producto_id", productoId)
    .order("orden_cat", { ascending: true });

  const ids = (imagenes ?? []).map((i) => i.id);
  const origen = ids.indexOf(imageId);
  if (origen === -1) return;

  const reordenados = [...ids];
  reordenados.splice(origen, 1);
  reordenados.splice(
    Math.max(0, Math.min(destino, reordenados.length)),
    0,
    imageId,
  );

  await reordenarImagenes(admin, productoId, reordenados);

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/", "layout");
}

export async function updateProductImageAlt(
  imageId: string,
  productoId: string,
  altText: string,
) {
  const { admin } = await assertAdmin();

  await admin
    .from("producto_imagenes")
    .update({ alt_text: altText.trim() || null })
    .eq("id", imageId);

  revalidatePath(`/admin/productos/${productoId}`);
}

async function reordenarImagenes(
  admin: Admin,
  productoId: string,
  idsOrdenados?: string[],
) {
  let ids = idsOrdenados;

  if (!ids) {
    const { data } = await admin
      .from("producto_imagenes")
      .select("id")
      .eq("producto_id", productoId)
      .order("orden_cat", { ascending: true });

    ids = (data ?? []).map((i) => i.id);
  }

  await Promise.all(
    ids.map((id, index) =>
      admin.from("producto_imagenes").update({ orden_cat: index }).eq("id", id),
    ),
  );
}

/**
 * Traduce URLs públicas del bucket a rutas internas y las borra.
 * Los fallos se ignoran a propósito: un objeto huérfano no rompe la app,
 * sólo ocupa espacio, y fallar el borrado del producto por eso sería peor.
 */
async function borrarObjetosDeStorage(admin: Admin, urls: string[]) {
  const rutas = urls
    .map((url) => {
      const match = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
      return match?.[1] ? decodeURIComponent(match[1]) : null;
    })
    .filter((ruta): ruta is string => Boolean(ruta))
    .filter((ruta) => ruta.startsWith(`${BUCKET_PRODUCTOS}/`));

  if (rutas.length === 0) return;

  try {
    await admin.storage.from(BUCKET_PRODUCTOS).remove(rutas);
  } catch {
    // Intencionalmente ignorado, ver comentario arriba.
  }
}
