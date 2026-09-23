import Grid from 'components/grid'
import { ThreeItemGrid } from 'components/grid/three-items-supabase'
import Footer from 'components/layout/footer'
import ProductoGridItems from 'components/layout/producto-grid-items'
import { getProductos } from '@/lib/db/productos'

export const metadata = {
  description:
    'Tienda de merchandising de anime y manga importado directamente desde Japón.',
  openGraph: {
    type: 'website',
  },
}

export default async function HomePage() {
  const productos = await getProductos()

  return (
    <>
      <ThreeItemGrid />
      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 pt-8">
        <h2 className="mb-4 text-2xl font-bold">Productos</h2>
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductoGridItems productos={productos} />
        </Grid>
      </section>
      <Footer />
    </>
  )
}