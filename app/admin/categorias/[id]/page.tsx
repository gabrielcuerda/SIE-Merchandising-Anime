import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/categorias/category-form";
import { DeleteCategoryButton } from "@/components/admin/categorias/delete-category-button";
import { Panel } from "@/components/admin/ui/panel";
import {
  countHijasDeCategoria,
  getPadresPermitidos,
  listCategoriasAdmin,
} from "@/lib/db/admin/categorias";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar categoría" };

export default async function EditarCategoriaPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;

  const [categorias, padresPermitidos] = await Promise.all([
    listCategoriasAdmin(),
    getPadresPermitidos(id),
  ]);

  const categoria = categorias.find((c) => c.id === id);
  if (!categoria) notFound();

  const hijas = await countHijasDeCategoria(id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/admin/categorias" className="hover:underline">
            ← Categorías
          </Link>
        </p>
        <h2 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
          {categoria.nombre}
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {categoria.productos_count} producto
          {categoria.productos_count === 1 ? "" : "s"}
          {hijas > 0 ? ` · ${hijas} subcategoría${hijas === 1 ? "" : "s"}` : ""}
        </p>
      </header>

      <CategoryForm
        values={{
          id: categoria.id,
          nombre: categoria.nombre,
          slug: categoria.slug,
          descripcion: categoria.descripcion ?? "",
          image_url: categoria.image_url ?? "",
          parent_id: categoria.parent_id ?? "",
          orden_cat: String(categoria.orden_cat ?? 0),
        }}
        padres={padresPermitidos}
        submitLabel="Guardar cambios"
      />

      <Panel title="Zona de riesgo">
        <div className="p-5">
          <DeleteCategoryButton
            categoriaId={categoria.id}
            nombre={categoria.nombre}
            productos={categoria.productos_count}
            hijas={hijas}
          />
        </div>
      </Panel>
    </div>
  );
}
