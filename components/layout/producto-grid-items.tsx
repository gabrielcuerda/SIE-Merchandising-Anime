import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import StatusBadge from "components/grid/status-badge";
import WishlistToggle from "@/components/wishlist/wishlist-toggle";
import type { Producto, ProductoImagen } from "@/lib/db/types";
import Link from "next/link";
import { translate } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";

export type ProductoConImagen = Producto & {
  producto_imagenes: ProductoImagen[];
};

export function getMainImage(producto: ProductoConImagen): string | undefined {
  if (!producto.producto_imagenes?.length) return undefined;
  const sorted = [...producto.producto_imagenes].sort(
    (a, b) => a.orden_cat - b.orden_cat,
  );
  return sorted[0]?.url;
}

export default async function ProductoGridItems({
  productos,
  wishlistProductIds = [],
}: {
  productos: ProductoConImagen[];
  wishlistProductIds?: string[];
}) {
  const lang = await getLang();
  return (
    <>
      {productos.map((producto) => (
        <Grid.Item key={producto.id} className="animate-fadeIn">
          <div className="relative h-full w-full">
            <Link
              className="relative block h-full w-full"
              href={`/product/${producto.slug}`}
              prefetch={true}
            >
              <GridTileImage
                alt={producto.titulo}
                badge={<StatusBadge status={producto.status} />}
                label={{
                  title: producto.titulo,
                  amount: producto.precio.toString(),
                  currencyCode: "EUR",
                }}
                src={getMainImage(producto) ?? "/placeholder.svg"}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              />
            </Link>
            {producto.stock === 0 ? (
              <div className="pointer-events-none absolute left-2 top-9 z-10">
                <span className="rounded-sm bg-alert-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  {translate(lang, "status.agotado")}
                </span>
              </div>
            ) : null}
            <WishlistToggle
              productId={producto.id}
              initialSaved={wishlistProductIds.includes(producto.id)}
            />
          </div>
        </Grid.Item>
      ))}
    </>
  );
}
