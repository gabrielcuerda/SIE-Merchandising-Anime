import { AdminPage } from "@/components/admin/admin-page";
import CategoriaForm from "@/components/admin/categoria-form";
import { AlertBanner, Card, CardContent } from "@/components/ui";
import { actualizarCategoria } from "@/app/admin/categorias/actions";
import { obtenerCategoria, listarCategorias } from "@/lib/admin/categorias";
import { fecha } from "@/lib/admin/formato";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [categoria, categorias] = await Promise.all([
    obtenerCategoria(id),
    listarCategorias(),
  ]);

  if (!categoria) notFound();

  const padre = categorias.find((c) => c.id === categoria.parent_id);

  return (
    <AdminPage
      eyebrow="Catálogo"
      titulo={categoria.nombre}
      descripcion={`/${categoria.slug}${padre ? ` · dentro de ${padre.nombre}` : " · categoría principal"} · creada ${fecha(categoria.created_at)}`}
    >
      <div className="mb-6 max-w-3xl">
        <AlertBanner tone="warning">
          No se puede eliminar una categoría que tenga productos o
          subcategorías: primero hay que reasignarlos. El borrado se rechazará
          diciéndote cuántos hay.
        </AlertBanner>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <CategoriaForm
              accion={actualizarCategoria}
              categorias={categorias}
              categoria={categoria}
              submitText="Guardar cambios"
            />
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
