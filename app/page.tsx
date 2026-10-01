import Grid from 'components/grid'
import { ThreeItemGrid } from 'components/grid/three-items-supabase'
import HeroCarousel from 'components/home/hero-carousel'
import PromoCarousel from 'components/home/promo-carousel'
import ProductSection from 'components/home/product-section'
import Footer from 'components/layout/footer'
import ProductoGridItems from 'components/layout/producto-grid-items'
import {
  getProductos,
  getProductosMasVendidos,
  getProductosNuevos,
  getProductosOferta,
} from '@/lib/db/productos'

export const metadata = {
  description:
    'Tienda de merchandising de anime y manga importado directamente desde Japón.',
  openGraph: {
    type: 'website',
  },
}

export default async function HomePage() {
  // Las 3 consultas se lanzan a la vez (no una detrás de otra) => más rápido
  const [productos, masVendidos, novedades, ofertas] = await Promise.all([
    getProductos(),
    getProductosMasVendidos(4),
    getProductosNuevos(4),
    getProductosOferta(),
  ])

  return (
    <>
      <HeroCarousel />
      <PromoCarousel />
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

      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 pt-4">
        <h2 className="mb-4 text-2xl font-bold">Todos los productos</h2>
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductoGridItems productos={productos} />
        </Grid>
      </section>
      <Footer />
    </>
  )
}
