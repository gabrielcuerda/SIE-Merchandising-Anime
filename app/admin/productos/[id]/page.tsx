import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DeleteProductButton,
  ImageUploader,
} from "@/components/admin/productos/image-uploader";
import {
  ProductForm,
  type ProductoFormValues,
} from "@/components/admin/productos/product-form";
import { Badge } from "@/components/admin/ui/badge";
import { Panel } from "@/components/admin/ui/panel";
import { dateTimeFormatter } from "@/lib/admin/constants";
import { countPedidosDelProducto, getProductoAdmin } from "@/lib/db/admin/productos";
import { getCategoriasJerarquicas } from "@/lib/db/categorias";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar producto" };

export default async function EditarProductoPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await props.params;

  const [producto, jerarquicas] = await Promise.all([
    getProductoAdmin(id),
    getCategoriasJerarquicas(),
  ]);

  if (!producto) {
    notFound();
  }

  const lineasPedido = await countPedidosDelProducto(id);
  const categorias = jerarquicas.flatMap((categoria) => [
    categoria,
    ...categoria.hijas,
  ]);

  const imagenes = [...(producto.producto_imagenes ?? [])].sort(
    (a, b) => a.orden_cat - b.orden_cat,
  );

  const values: ProductoFormValues = {
    id: producto.id,
    titulo: producto.titulo,
    slug: producto.slug,
    descripcion: producto.descripcion ?? "",
    precio: String(producto.precio ?? ""),
    stock: String(producto.stock ?? 0),
    status: producto.status,
    categoria_id: producto.categoria_id ?? "",
    destacado: Boolean(producto.destacado),
    sku: producto.sku ?? "",
    tags: (producto.tags ?? []).join(", "),
    variantes: [...(producto.producto_variantes ?? [])]
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"))
      .map((variante) => ({
        key: variante.id,
        id: variante.id,
        titulo: variante.titulo,
        sku: variante.sku ?? "",
        precio: String(variante.precio ?? ""),
        stock: String(variante.stock ?? 0),
      })),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            <Link href="/admin/productos" className="hover:underline">
              ← Productos
            </Link>
          </p>
          <h2 className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
            {producto.titulo}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Creado el {dateTimeFormatter.format(new Date(producto.created_at))}
            {" · "}
            {lineasPedido === 0
              ? "sin pedidos asociados"
              : `${lineasPedido} línea${lineasPedido === 1 ? "" : "s"} de pedido`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/product/${producto.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Ver en la tienda
          </Link>
          <Link
            href="/admin/productos"
            className="rounded-md px-4 py-2 text-sm text-neutral-600 hover:underline dark:text-neutral-300"
          >
            Volver
          </Link>
        </div>
      </header>

      {lineasPedido > 0 ? (
        <Panel>
          <p className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
            Este producto ya aparece en pedidos, así que{" "}
            <strong>no se puede eliminar</strong> mientras siga teniendo líneas
            de pedido. Para retirarlo del catálogo, pon el stock a 0 o cambia su
            estado.
          </p>
        </Panel>
      ) : null}

      <ProductForm
        values={values}
        categorias={categorias}
        submitLabel="Guardar cambios"
      />

      <Panel
        title="Imágenes"
        description="La primera de la lista es la portada que se ve en la tienda."
      >
        <ImageUploader productoId={producto.id} imagenes={imagenes} />
      </Panel>

      <Panel title="Zona de riesgo">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={producto.status === "stock" ? "success" : "neutral"}>
              {producto.stock} en stock
            </Badge>
            <Badge tone="neutral">
              {imagenes.length} imagen{imagenes.length === 1 ? "" : "es"}
            </Badge>
          </div>

          <DeleteProductButton productoId={producto.id} titulo={producto.titulo} />
        </div>
      </Panel>
    </div>
  );
}
