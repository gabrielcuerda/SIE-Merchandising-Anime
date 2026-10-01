"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { slugify } from "@/lib/admin/storage";
import {
  countHijasDeCategoria,
  countProductosDeCategoria,
} from "@/lib/db/admin/categorias";
import type { AdminActionState } from "@/app/admin/actions/productos";
import { AdminAuthError, assertAdmin } from "@/lib/supabase/require-admin";
import type { Categoria } from "@/lib/db/types";

function getValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRedirect(error: unknown) {
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

export async function saveCategoria(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { admin } = await assertAdmin();

    const id = getValue(formData, "id");
    const fieldErrors: Record<string, string> = {};

    const nombre = getValue(formData, "nombre");
    if (nombre.length < 2) {
      fieldErrors.nombre = "El nombre debe tener al menos 2 caracteres.";
    }

    const slug = getValue(formData, "slug") || slugify(nombre);
    if (!slug) {
      fieldErrors.slug = "No se ha podido generar un slug a partir del nombre.";
    }

    const parentId = getValue(formData, "parent_id") || null;

    if (id && parentId === id) {
      fieldErrors.parent_id = "Una categoría no puede ser su propia madre.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { error: "Revisa los campos marcados.", fieldErrors };
    }

    const payload: Partial<Categoria> = {
      nombre,
      slug,
      descripcion: getValue(formData, "descripcion") || null,
      image_url: getValue(formData, "image_url") || null,
      parent_id: parentId,
      orden_cat: toNumber(getValue(formData, "orden_cat")),
      created_at: new Date().toISOString(),
    };

    if (id) {
      // La validación del ciclo (no elegir una hija como madre) la hace la
      // página antes de renderizar, pero se repite aquí porque es la única
      // garantía si alguien llama a la action directamente.
      if (parentId && (await esDescendiente(admin, id, parentId))) {
        return {
          error: "Revisa los campos marcados.",
          fieldErrors: {
            parent_id: "No puedes mover una categoría dentro de sí misma.",
          },
        };
      }

      const { error } = await admin
        .from("categorias")
        .update(payload)
        .eq("id", id);

      if (error) {
        return {
          error: "No hemos podido guardar la categoría.",
          fieldErrors: { slug: "Es posible que el slug ya esté en uso." },
        };
      }
    } else {
      const { error } = await admin.from("categorias").insert(payload);
      if (error) {
        return {
          error: "No hemos podido crear la categoría.",
          fieldErrors: { slug: "Es posible que el slug ya esté en uso." },
        };
      }
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/productos");
    revalidatePath("/", "layout");

    if (!id) {
      redirect("/admin/categorias");
    }

    return { success: "Categoría guardada correctamente." };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return toErrorState(error, "No hemos podido guardar la categoría.");
  }
}

/**
 * Borrado. Se bloquea si tiene subcategorías o productos: eliminarla dejaría
 * productos sin categoría y colgaría sus hijas de un padre inexistente.
 */
export async function deleteCategoria(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const { admin } = await assertAdmin();

    const id = getValue(formData, "id");
    if (!id) return { error: "La categoría no es válida." };

    const [hijas, productos] = await Promise.all([
      countHijasDeCategoria(id),
      countProductosDeCategoria(id),
    ]);

    if (hijas > 0) {
      return {
        error: `No se puede eliminar: tiene ${hijas} subcategoría${
          hijas === 1 ? "" : "s"
        }. Elimínalas o muévelas antes.`,
      };
    }

    if (productos > 0) {
      return {
        error: `No se puede eliminar: tiene ${productos} producto${
          productos === 1 ? "" : "s"
        }. Reasígnalos a otra categoría o pon su categoría en blanco.`,
      };
    }

    const { error } = await admin.from("categorias").delete().eq("id", id);
    if (error) {
      return { error: "No hemos podido eliminar la categoría." };
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/", "layout");

    return { success: "Categoría eliminada." };
  } catch (error) {
    return toErrorState(error, "No hemos podido eliminar la categoría.");
  }
}

/** `true` si `candidatoId` está dentro del subárbol de `categoriaId`. */
async function esDescendiente(
  admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  categoriaId: string,
  candidatoId: string,
): Promise<boolean> {
  const visitados = new Set<string>();
  let actual: string | null = candidatoId;

  while (actual && !visitados.has(actual)) {
    if (actual === categoriaId) return true;

    visitados.add(actual);

    const { data }: { data: { parent_id: string | null } | null } = await admin
      .from("categorias")
      .select("parent_id")
      .eq("id", actual)
      .maybeSingle();

    actual = data?.parent_id ?? null;
  }

  return false;
}
