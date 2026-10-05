import { AdminPage } from "@/components/admin/admin-page";
import ProductoForm from "@/components/admin/producto-form";
import ProductoImagenes from "@/components/admin/producto-imagenes";
import ProductoVariantes from "@/components/admin/producto-variantes";
import { Seccion } from "@/components/admin/campos";
import { Card, CardContent } from "@/components/ui";
import { actualizarProducto } from "@/app/admin/productos/actions";
import { listarCategorias } from "@/lib/admin/categorias";
import { obtenerProducto, listarSlugs } from "@/lib/admin/productos";
import { fechaYhora, precioSinIVA } from "@/lib/admin/formato";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Editor de producto: datos, imágenes y variantes.
 *
 * La imagen se sirve desde el bucket público con `next/image`. El host
 * `**.supabase.co/storage/v1/object/public/**` ya está en `images.remotePatterns`
 * de `next.config.ts`, así que no hace falta ninguna configuración extra.
 */
export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [producto, categorias] = await Promise.all([
    obtenerProducto(id),
    listarCategorias(),
  ]);

  if (!producto) notFound();

  const slugsUsados = await listarSlugs(id);
  const fichaPublica = `/product/${producto.slug}`;

  return (
    <AdminPage
      eyebrow="Catálogo"
      titulo={producto.titulo}
      descripcion={`${precioSinIVA(producto.precio)} · SKU ${producto.sku ?? "sin SKU"} · actualizado ${fechaYhora(producto.updated_at)}`}
      acciones={
        <Link
          href={fichaPublica}
          className="text-sm font-medium text-ink-600 underline underline-offset-4 hover:text-ink-950"
        >
          Ver la ficha pública
        </Link>
      }
    >
      <Seccion
        titulo="Datos"
        descripcion="El identificador solo cambia si lo editas: si el producto ya está publicado, su URL depende de él."
      >
        <Card>
          <CardContent className="pt-6">
            <ProductoForm
              accion={actualizarProducto}
              categorias={categorias}
              producto={producto}
              slugsUsados={slugsUsados}
            />
          </CardContent>
        </Card>
      </Seccion>

      <Seccion
        titulo="Imágenes"
        descripcion="La primera de la lista es la portada. El formato y el tamaño se vuelven a comprobar en el servidor y en el bucket."
      >
        <ProductoImagenes
          productoId={producto.id}
          imagenes={producto.producto_imagenes}
        />
      </Seccion>

      <Seccion
        titulo="Variantes"
        descripcion="Opcional. Si un producto no tiene variantes, la tienda muestra una única variante al precio del propio producto."
      >
        <ProductoVariantes
          productoId={producto.id}
          variantes={producto.producto_variantes}
        />
      </Seccion>
    </AdminPage>
  );
}
