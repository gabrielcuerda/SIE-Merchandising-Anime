import { AddToCart } from "components/cart/add-to-cart";
import StatusBadge from "components/grid/status-badge";
import Price from "components/price";
import Prose from "components/prose";

import { Product } from "@/lib/commerce/types";
import { VariantSelector } from "./variant-selector";

/** Texto y color del indicador de disponibilidad */
function disponibilidad(product: Product): { texto: string; clase: string } {
  if (product.status === "pre-venta")
    return {
      texto: "Pre-venta · se envía al lanzamiento oficial",
      clase: "text-amber-600",
    };
  if (product.status === "a-pedido")
    return {
      texto: "Bajo pedido · plazo estimado de 2 a 3 semanas",
      clase: "text-sky-600",
    };
  if (product.stock <= 0) return { texto: "Agotado", clase: "text-rose-600" };
  if (product.stock <= 5)
    return {
      texto: `¡Solo quedan ${product.stock} unidades!`,
      clase: "text-orange-600",
    };
  return {
    texto: `${product.stock} unidades en stock`,
    clase: "text-emerald-600",
  };
}

export function ProductDescription({ product }: { product: Product }) {
  const estado = disponibilidad(product);

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-3 text-5xl font-medium">{product.title}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-blue-600 p-2 text-sm text-white">
            <Price
              amount={product.priceRange.maxVariantPrice.amount}
              currencyCode={product.priceRange.maxVariantPrice.currencyCode}
            />
          </div>
          <StatusBadge status={product.status} />
        </div>

        <p className={`mt-3 text-sm font-medium ${estado.clase}`}>
          {estado.texto}
        </p>
      </div>

      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <AddToCart product={product} />
    </>
  );
}