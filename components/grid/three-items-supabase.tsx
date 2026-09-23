import { GridTileImage } from 'components/grid/tile'
import Link from 'next/link'
import { getProductosDestacados } from '@/lib/db/productos'
import { getMainImage, type ProductoConImagen } from 'components/layout/producto-grid-items'

function ThreeItemGridItem({
  item,
  size,
  priority,
}: {
  item: ProductoConImagen
  size: 'full' | 'half'
  priority?: boolean
}) {
  return (
    <div
      className={
        size === 'full'
          ? 'md:col-span-4 md:row-span-2'
          : 'md:col-span-2 md:row-span-1'
      }
    >
      <Link
        className="relative block aspect-square h-full w-full"
        href={`/product/${item.slug}`}
        prefetch={true}
      >
        <GridTileImage
          src={getMainImage(item) ?? ''}
          fill
          sizes={
            size === 'full'
              ? '(min-width: 768px) 66vw, 100vw'
              : '(min-width: 768px) 33vw, 100vw'
          }
          priority={priority}
          alt={item.titulo}
          label={{
            position: size === 'full' ? 'center' : 'bottom',
            title: item.titulo,
            amount: item.precio.toString(),
            currencyCode: 'EUR',
          }}
        />
      </Link>
    </div>
  )
}

export async function ThreeItemGrid() {
  const productos = await getProductosDestacados()

  if (!productos[0] || !productos[1] || !productos[2]) return null

  const [firstProduct, secondProduct, thirdProduct] = productos

  return (
    <section className="mx-auto grid max-w-(--breakpoint-2xl) gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
      <ThreeItemGridItem size="full" item={firstProduct} priority={true} />
      <ThreeItemGridItem size="half" item={secondProduct} priority={true} />
      <ThreeItemGridItem size="half" item={thirdProduct} />
    </section>
  )
}