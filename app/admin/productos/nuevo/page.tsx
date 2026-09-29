import { ProductForm, PRODUCTO_VACIO } from "@/components/admin/productos/product-form";
import { getCategoriasJerarquicas } from "@/lib/db/categorias";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage() {
  await requireAdmin();

  const jerarquicas = await getCategoriasJerarquicas();

  /** Aplana el árbol: el formulario sólo necesita una lista de categorías. */
  const categorias = jerarquicas.flatMap((categoria) => [
    categoria,
    ...categoria.hijas,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Nuevo producto
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Al guardar se abrirá su ficha para que le añadas las imágenes.
        </p>
      </header>

      <ProductForm
        values={PRODUCTO_VACIO}
        categorias={categorias}
        submitLabel="Crear producto"
      />
    </div>
  );
}
