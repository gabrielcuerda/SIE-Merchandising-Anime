import { AdminPage } from "@/components/admin/admin-page";
import CategoriaForm from "@/components/admin/categoria-form";
import { AlertBanner, Card, CardContent } from "@/components/ui";
import { crearCategoria } from "@/app/admin/categorias/actions";
import { listarCategorias } from "@/lib/admin/categorias";

export const dynamic = "force-dynamic";

export default async function NuevaCategoriaPage() {
  const categorias = await listarCategorias();

  return (
    <AdminPage
      eyebrow="Catálogo"
      titulo="Nueva categoría"
      descripcion="Las categorías ordenan el catálogo y el menú de la tienda."
    >
      <div className="mb-6 max-w-3xl">
        <AlertBanner tone="info">
          El árbol admite <strong>un solo nivel</strong>, que es lo que espera
          el menú de la tienda. El nombre y el identificador tienen que ser
          únicos entre categorías del mismo nivel.
        </AlertBanner>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <CategoriaForm
              accion={crearCategoria}
              categorias={categorias}
              submitText="Crear categoría"
            />
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
