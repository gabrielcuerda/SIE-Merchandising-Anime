import { getCategoria } from "@/lib/db/categorias";
import { getProductosByCategoria } from "@/lib/db/productos";
import { Metadata } from "next";
import Link from "next/link";
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
    description:
      categoria.descripcion ||
      `Catálogo de figuras y merchandising de ${categoria.nombre} importados desde Japón`,
  };
}

function Breadcrumb({ nombre }: { nombre: string }) {
  const migas = [
    { nombre: "Inicio", href: "/" },
    { nombre: "Categorías", href: "/search" },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-blue-100/80">
        {migas.map((miga) => (
          <li key={miga.href} className="flex items-center gap-1.5">
            <Link
              href={miga.href}
              className="transition hover:text-white hover:underline"
            >
              {miga.nombre}
            </Link>
            <span aria-hidden="true">›</span>
          </li>
        ))}
        <li aria-current="page" className="font-medium text-white">
          {nombre}
        </li>
      </ol>
    </nav>
  );
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort, estado, precio } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const categoria = await getCategoria(params.collection);
  if (!categoria) return notFound();

  const productos = await getProductosByCategoria(params.collection, {
    sortKey,
    reverse,
    estado,
    precio,
  });

  const descripcion =
    categoria.descripcion ||
    `Catálogo de figuras y merchandising de ${categoria.nombre}`;

  const textoContador =
    productos.length === 1 ? "1 producto" : `${productos.length} productos`;

  return (
    <section>
      {productos.length === 0 ? (
        <p className="py-3 text-lg">{`No hay productos en esta categoría`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ProductoGridItems productos={productos} />
        </Grid>
      )}
    </section>
  );
}
