import Grid from "components/grid";
import ProductoGridItems from "components/layout/producto-grid-items";
import Link from "next/link";
import { getWishlistProductos } from "@/lib/db/wishlist";

type WishlistListProps = {
  userId: string;
  title?: string;
  description?: string;
};

export default async function WishlistList({
  userId,
  title = "Lista de deseos",
  description = "Guarda aquí los productos que quieras comprar más tarde.",
}: WishlistListProps) {
  const items = await getWishlistProductos(userId);
  const productos = items.map((item) => item.productos);
  const wishlistProductIds = items.map((item) => item.producto_id);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>

      {productos.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-black">
          <p className="font-medium">Tu lista está vacía.</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Pulsa el corazón de cualquier producto para guardarlo aquí.
          </p>
          <Link
            className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            href="/search"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductoGridItems
            productos={productos}
            wishlistProductIds={wishlistProductIds}
          />
        </Grid>
      )}
    </section>
  );
}
