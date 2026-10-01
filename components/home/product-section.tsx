import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Grid from "components/grid";
import ProductoGridItems, {
  type ProductoConImagen,
} from "components/layout/producto-grid-items";
import Link from "next/link";

type ProductSectionProps = {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  productos: ProductoConImagen[];
  emptyMessage?: string;
};

export default function ProductSection({
  title,
  subtitle,
  href,
  hrefLabel = "Ver todo",
  productos,
  emptyMessage,
}: ProductSectionProps) {
  // Si no hay productos y no hemos preparado un mensaje, la sección no se pinta
  if (productos.length === 0 && !emptyMessage) return null;

  return (
    <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {hrefLabel}
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {productos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
          {emptyMessage}
        </p>
      ) : (
        <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <ProductoGridItems productos={productos} />
        </Grid>
      )}
    </section>
  );
}