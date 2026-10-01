import Grid from "components/grid";

import ProductoGridItems from "components/layout/producto-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { createUrl } from "lib/utils";
import { getProductos } from "@/lib/db/productos";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Busca productos en la tienda.",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue, estado, precio } = searchParams as Record<
    string,
    string
  >;
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const productos = await getProductos({
    sortKey,
    reverse,
    query: searchValue,
     estado,
    precio,
  });

  const hayFiltros = Boolean(searchValue || estado || precio);
  const total = productos.length;
  const resultsText = total === 1 ? "resultado" : "resultados";

  const limpiarHref = createUrl(
    "/search",
    new URLSearchParams({ ...(searchValue && { q: searchValue }) }),
  );

  return (
    <>
      {searchValue ? (
        <p className="mb-4">
          {productos.length === 0
            ? "No hay productos que coincidan con "
            : `Mostrando ${productos.length} ${resultsText} para `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}
      {total > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ProductoGridItems productos={productos} />
        </Grid>
      ) : null}
    </>
  );
}
