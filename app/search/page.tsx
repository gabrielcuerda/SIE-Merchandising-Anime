import Grid from "components/grid";
import ProductoGridItems from "components/layout/producto-grid-items";
import { defaultSort, sorting } from "lib/constants";
import { getProductos } from "@/lib/db/productos";

export const metadata = {
  title: "Search",
  description: "Busca productos en la tienda.",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const productos = await getProductos({ sortKey, reverse, query: searchValue });
  const resultsText = productos.length > 1 ? "resultados" : "resultado";

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
      {productos.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductoGridItems productos={productos} />
        </Grid>
      ) : null}
    </>
  );
}