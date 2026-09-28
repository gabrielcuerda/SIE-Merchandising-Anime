import Grid from "components/grid";
import { ThreeItemGrid } from "components/grid/three-items-supabase";
import HeroCarousel from "components/home/hero-carousel";
import ProductSection from "components/home/product-section";
import ProductoGridItems from "components/layout/producto-grid-items";
import {
  getProductos,
  getProductosMasVendidos,
  getProductosNuevos,
  getProductosOferta,
} from "@/lib/db/productos";

export const metadata = {
  description:
    "Tienda de merchandising de anime y manga importado directamente desde Japón.",
  openGraph: {
    type: "website",
  },
};

export default async function HomePage() {
  // Las 3 consultas se lanzan a la vez (no una detrás de otra) => más rápido
  const [productos, masVendidos, novedades, ofertas] = await Promise.all([
    getProductos(),
    getProductosMasVendidos(4),
    getProductosNuevos(4),
    getProductosOferta(),
  ]);

  return (
    <>
      <HeroCarousel />
      <ThreeItemGrid />

      <ProductSection
        title="Más vendidos"
        subtitle="Ordenado por las unidades vendidas en pedidos confirmados"
        href="/search?sort=trending-desc"
        hrefLabel="Ver los más vendidos"
        productos={masVendidos}
      />

      <ProductSection
        title="Novedades"
        subtitle="Lo último que ha llegado al catálogo"
        href="/search?sort=latest-desc"
        hrefLabel="Ver novedades"
        productos={novedades}
      />

      <ProductSection
        title="Ofertas"
        subtitle="Precios rebajados mientras dure la promoción"
        href="/search"
        hrefLabel="Ver todo el catálogo"
        productos={ofertas}
        emptyMessage="Ahora mismo no hay ofertas activas. ¡Vuelve pronto!"
      />

      <section className="page-container pb-8 pt-4">
        <h2 className="mb-4 text-2xl font-extrabold uppercase tracking-tight">
          Todos los productos
        </h2>
        <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <ProductoGridItems productos={productos} />
        </Grid>
      </section>
    </>
  );
}
