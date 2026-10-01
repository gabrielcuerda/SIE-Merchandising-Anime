import { CategoryForm, CATEGORIA_VACIA } from "@/components/admin/categorias/category-form";
import { getPadresPermitidos } from "@/lib/db/admin/categorias";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nueva categoría" };

export default async function NuevaCategoriaPage() {
  await requireAdmin();

  const padres = await getPadresPermitidos();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Nueva categoría
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Agrupa productos y define cómo aparecen en el menú de la tienda.
        </p>
      </header>

      <CategoryForm
        values={CATEGORIA_VACIA}
        padres={padres}
        submitLabel="Crear categoría"
      />
    </div>
  );
}
