import { getCategoria } from "@/lib/db/categorias";
import { getProductosByCategoria } from "@/lib/db/productos";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import Grid from "components/grid";
import ProductoGridItems from "components/layout/producto-grid-items";
import { defaultSort, sorting } from "lib/constants";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const categoria = await getCategoria(params.collection);

  if (!categoria) return notFound();

  return {
    title: categoria.nombre,
    description: categoria.descripcion || `${categoria.nombre} products`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const categoria = await getCategoria(params.collection);
  if (!categoria) return notFound();

  const productos = await getProductosByCategoria(params.collection, {
    sortKey,
    reverse,
  });

  return (
    <section>
      {productos.length === 0 ? (
        <p className="py-3 text-lg">{`No hay productos en esta categoría`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductoGridItems productos={productos} />
        </Grid>
      )}
    </section>
  );
}