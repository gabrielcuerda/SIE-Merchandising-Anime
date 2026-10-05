import { AdminPage } from "@/components/admin/admin-page";
import ProductoForm from "@/components/admin/producto-form";
import { Card, CardContent } from "@/components/ui";
import { AlertBanner } from "@/components/ui";
import { crearProducto } from "@/app/admin/productos/actions";
import { listarCategorias } from "@/lib/admin/categorias";
import { listarSlugs } from "@/lib/admin/productos";

export const dynamic = "force-dynamic";

/**
 * Alta de producto.
 *
 * No hay gestión de imágenes aquí: el producto tiene que existir antes de poder
 * subir nada, porque la carpeta en Storage se deriva de su id. Por eso la action
 * `crearProducto` redirige al editor en lugar de quedarse en el formulario.
 */
export default async function NuevoProductoPage() {
  const [categorias, slugsUsados] = await Promise.all([
    listarCategorias(),
    listarSlugs(),
  ]);

  return (
    <AdminPage
      eyebrow="Catálogo"
      titulo="Nuevo producto"
      descripcion="Rellena los datos básicos. Las imágenes y las variantes se añaden después de guardar."
    >
      <div className="mb-6 max-w-3xl">
        <AlertBanner tone="info">
          Al guardar, el producto existe ya y podrás subirle las imágenes y
          definir sus variantes. El precio se guarda <strong>sin IVA</strong>:
          el 21 % se aplica en el pago.
        </AlertBanner>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <ProductoForm
              accion={crearProducto}
              categorias={categorias}
              slugsUsados={slugsUsados}
              submitText="Crear producto"
            />
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
