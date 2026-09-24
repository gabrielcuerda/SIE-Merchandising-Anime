import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import WishlistToggle from "@/components/wishlist/wishlist-toggle";
import type { Producto, ProductoImagen } from "@/lib/db/types";
import Link from "next/link";

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

export default function ProductoGridItems({
  productos,
  wishlistProductIds = [],
}: {
  productos: ProductoConImagen[];
  wishlistProductIds?: string[];
}) {
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
                label={{
                  title: producto.titulo,
                  amount: producto.precio.toString(),
                  currencyCode: "EUR",
                }}
                src={getMainImage(producto) ?? ""}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </Link>
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
