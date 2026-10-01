import Image from "next/image";
import Link from "next/link";

import { DeleteCategoryButton } from "@/components/admin/categorias/delete-category-button";
import { LinkButton } from "@/components/admin/ui/button";
import {
  EmptyState,
  Panel,
  TableWrap,
  Td,
  Th,
  Tr,
} from "@/components/admin/ui/panel";
import {
  listCategoriasAdmin,
  type CategoriaConConteo,
} from "@/lib/db/admin/categorias";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categorías" };

export default async function AdminCategoriasPage() {
  await requireAdmin();

  const categorias = await listCategoriasAdmin();
  const porId = new Map(categorias.map((c) => [c.id, c]));

  const raices = categorias.filter((c) => !c.parent_id);
  const nivel = 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Categorías
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {categorias.length === 0
              ? "Todavía no hay categorías."
              : `${categorias.length} categoría${
                  categorias.length === 1 ? "" : "s"
                }. Las subcategorías se anidan bajo su categoría superior.`}
          </p>
        </div>
        <LinkButton href="/admin/categorias/nueva">
          <span aria-hidden>+</span> Nueva categoría
        </LinkButton>
      </header>

      <Panel>
        {categorias.length === 0 ? (
          <EmptyState
            title="No hay categorías"
            description="Crea la primera para poder organizar el catálogo."
            action={
              <LinkButton href="/admin/categorias/nueva" variant="neutral">
                Crear categoría
              </LinkButton>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Categoría</Th>
                <Th>Superior</Th>
                <Th className="text-right">Orden</Th>
                <Th className="text-right">Productos</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {aplanar(raices, porId, nivel).map(({ categoria, profundidad }) => (
                <Tr key={categoria.id}>
                  <Td>
                    <div
                      className="flex items-center gap-3"
                      style={{ paddingLeft: `${profundidad * 20}px` }}
                    >
                      {categoria.image_url ? (
                        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
                          <Image
                            src={categoria.image_url}
                            alt=""
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                          />
                        </span>
                      ) : null}

                      <span className="min-w-0">
                        <Link
                          href={`/admin/categorias/${categoria.id}`}
                          className="font-medium hover:underline"
                        >
                          {categoria.nombre}
                        </Link>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          /{categoria.slug}
                        </span>
                      </span>
                    </div>
                  </Td>
                  <Td className="text-neutral-500 dark:text-neutral-400">
                    {categoria.parent_id
                      ? (porId.get(categoria.parent_id)?.nombre ?? "—")
                      : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {categoria.orden_cat}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {categoria.productos_count}
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/admin/categorias/${categoria.id}`}
                      className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      Editar
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

/** Recorre el árbol y aplana a filas con su profundidad para poder indentar. */
function aplanar(
  raices: CategoriaConConteo[],
  porId: Map<string, CategoriaConConteo>,
  profundidadInicial: number,
): { categoria: CategoriaConConteo; profundidad: number }[] {
  const filas: { categoria: CategoriaConConteo; profundidad: number }[] = [];

  const visitar = (categoria: CategoriaConConteo, profundidad: number) => {
    filas.push({ categoria, profundidad });

    for (const hija of porId.values()) {
      if (hija.parent_id === categoria.id) {
        visitar(hija, profundidad + 1);
      }
    }
  };

  for (const raiz of raices) {
    visitar(raiz, profundidadInicial);
  }

  return filas;
}
