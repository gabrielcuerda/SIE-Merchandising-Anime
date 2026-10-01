import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/admin/ui/badge";
import { LinkButton } from "@/components/admin/ui/button";
import {
  EmptyState,
  Panel,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui/panel";
import { Pagination } from "@/components/admin/ui/pagination";
import {
  currencyFormatter,
  productoStatusLabels,
  productoStatusTones,
} from "@/lib/admin/constants";
import { getCategoriasJerarquicas } from "@/lib/db/categorias";
import { listProductosAdmin } from "@/lib/db/admin/productos";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Productos" };

type SearchParams = Promise<{
  q?: string;
  categoria?: string;
  status?: string;
  orden?: string;
  page?: string;
}>;

const ORDENES = [
  { value: "creados", label: "Más recientes" },
  { value: "titulo", label: "Título (A-Z)" },
  { value: "precio", label: "Precio (menor a mayor)" },
  { value: "stock", label: "Stock (menor a mayor)" },
] as const;

export default async function AdminProductosPage(props: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page ?? "1") || 1;

  const [categorias, resultado] = await Promise.all([
    getCategoriasJerarquicas(),
    listProductosAdmin({
      busqueda: searchParams.q,
      categoriaId: searchParams.categoria,
      status: searchParams.status,
      orden: searchParams.orden,
      page,
    }),
  ]);

  const money = currencyFormatter("EUR");
  const { productos, total, totalPages } = resultado;

  /** Reconstruye la URL conservando los filtros activos. */
  const buildHref = (destino: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.categoria) params.set("categoria", searchParams.categoria);
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.orden) params.set("orden", searchParams.orden);
    if (destino > 1) params.set("page", String(destino));
    const query = params.toString();
    return `/admin/productos${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Productos
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {total === 0
              ? "No hay productos que coincidan con el filtro."
              : `${total} producto${total === 1 ? "" : "s"} en el catálogo.`}
          </p>
        </div>
        <LinkButton href="/admin/productos/nuevo">
          <span aria-hidden>+</span> Nuevo producto
        </LinkButton>
      </header>

      <Filtros
        busqueda={searchParams.q ?? ""}
        categoriaId={searchParams.categoria ?? ""}
        status={searchParams.status ?? ""}
        orden={searchParams.orden ?? "creados"}
        categorias={categorias}
      />

      <Panel>
        {productos.length === 0 ? (
          <EmptyState
            title="Ningún producto coincide"
            description="Prueba a cambiar la búsqueda o los filtros aplicados."
            action={
              <LinkButton href="/admin/productos/nuevo" variant="neutral">
                Crear el primero
              </LinkButton>
            }
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th>Categoría</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Precio</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => {
                  const imagen = [...(producto.producto_imagenes ?? [])].sort(
                    (a, b) => a.orden_cat - b.orden_cat,
                  )[0];

                  return (
                    <Tr key={producto.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                            {imagen ? (
                              <Image
                                src={imagen.url}
                                alt={imagen.alt_text ?? producto.titulo}
                                width={44}
                                height={44}
                                className="h-full w-full object-contain"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={`/admin/productos/${producto.id}`}
                              className="font-medium hover:underline"
                            >
                              {producto.titulo}
                            </Link>
                            {producto.destacado ? (
                              <span className="ml-2 align-middle text-[10px] font-semibold tracking-wide text-blue-700 uppercase dark:text-blue-400">
                                Destacado
                              </span>
                            ) : null}
                            <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                              /{producto.slug}
                              {(producto.producto_variantes ?? []).length > 0
                                ? ` · ${producto.producto_variantes.length} variante${
                                    producto.producto_variantes.length === 1
                                      ? ""
                                      : "s"
                                  }`
                                : ""}
                            </span>
                          </span>
                        </div>
                      </Td>
                      <Td className="text-neutral-500 dark:text-neutral-400">
                        {categoriaPorId(categorias, producto.categoria_id) ?? "—"}
                      </Td>
                      <Td>
                        <Badge tone={productoStatusTones[producto.status]}>
                          {productoStatusLabels[producto.status]}
                        </Badge>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {money.format(Number(producto.precio))}
                      </Td>
                      <Td className="text-right tabular-nums">
                        <Badge
                          tone={
                            producto.stock === 0
                              ? "danger"
                              : producto.stock <= 5
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {producto.stock}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/productos/${producto.id}`}
                          className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                        >
                          Editar
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>

            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </Panel>
    </div>
  );
}

/** Aplana el árbol para poder buscar por id en la columna. */
function categoriaPorId(
  categorias: Awaited<ReturnType<typeof getCategoriasJerarquicas>>,
  id: string | null,
): string | null {
  if (!id) return null;

  for (const categoria of categorias) {
    if (categoria.id === id) return categoria.nombre;
    const hija = categoria.hijas.find((h) => h.id === id);
    if (hija) return `${categoria.nombre} › ${hija.nombre}`;
  }

  return null;
}

function Filtros({
  busqueda,
  categoriaId,
  status,
  orden,
  categorias,
}: {
  busqueda: string;
  categoriaId: string;
  status: string;
  orden: string;
  categorias: Awaited<ReturnType<typeof getCategoriasJerarquicas>>;
}) {
  return (
    <form
      method="get"
      action="/admin/productos"
      className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="lg:col-span-2">
        <label
          htmlFor="q"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300"
        >
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={busqueda}
          placeholder="Título o SKU"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="categoria"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300"
        >
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          defaultValue={categoriaId}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          <option value="">Todas</option>
          {categorias.map((categoria) => (
            <optgroup key={categoria.id} label={categoria.nombre}>
              <option value={categoria.id}>{categoria.nombre}</option>
              {categoria.hijas.map((hija) => (
                <option key={hija.id} value={hija.id}>
                  {`— ${hija.nombre}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="status"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300"
        >
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          <option value="">Todos</option>
          {Object.entries(productoStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="orden"
          className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-300"
        >
          Ordenar por
        </label>
        <select
          id="orden"
          name="orden"
          defaultValue={orden}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          {ORDENES.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Aplicar filtros
        </button>
        {(busqueda || categoriaId || status || orden !== "creados") && (
          <Link
            href="/admin/productos"
            className="px-2 py-2 text-sm text-neutral-500 hover:underline"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
