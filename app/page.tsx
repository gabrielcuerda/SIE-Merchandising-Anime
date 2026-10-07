import Grid from "components/grid";
import HeroCarousel from "components/home/hero-carousel";
import PromoCarousel from "components/home/promo-carousel";
import ProductSection from "components/home/product-section";
import ProductoGridItems from "components/layout/producto-grid-items";
import type { Metadata } from "next";
import { translate } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";

import {
  getProductos,
  getProductosMasVendidos,
  getProductosNuevos,
  getProductosOferta,
} from "@/lib/db/productos";

export const metadata: Metadata = {
  description:
    "Tienda de merchandising de anime y manga importado directamente desde Japón.",
  openGraph: {
    type: "website",
  },
};

export default async function HomePage() {
  // Las 3 consultas se lanzan a la vez (no una detrás de otra) => más rápido
  const lang = await getLang();
  const [productos, masVendidos, novedades, ofertas] = await Promise.all([
    getProductos(),
    getProductosMasVendidos(4),
    getProductosNuevos(4),
    getProductosOferta(),
  ]);

  return (
    <>
      <HeroCarousel />
      <PromoCarousel />

      <ProductSection
        title={translate(lang, "home.bestSellers.title")}
        subtitle={translate(lang, "home.bestSellers.subtitle")}
        href="/search?sort=trending-desc"
        hrefLabel={translate(lang, "home.bestSellers.cta")}
        productos={masVendidos}
      />

      <ProductSection
        title={translate(lang, "home.news.title")}
        subtitle={translate(lang, "home.news.subtitle")}
        href="/search?sort=latest-desc"
        hrefLabel={translate(lang, "home.news.cta")}
        productos={novedades}
      />

      <ProductSection
        title={translate(lang, "home.offers.title")}
        subtitle={translate(lang, "home.offers.subtitle")}
        href="/search"
        hrefLabel={translate(lang, "home.offers.cta")}
        productos={ofertas}
        emptyMessage={translate(lang, "home.offers.empty")}
      />

      <section className="page-container pb-8 pt-4">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-blue-900 uppercase">
          {translate(lang, "home.allProducts")}
        </h2>
        <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <ProductoGridItems productos={productos} />
        </Grid>
      </section>
    </>
  );
}
