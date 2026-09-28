"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "components/cart/actions";
import { Product, ProductVariant } from "@/lib/commerce/types";
import { addItem } from "@/components/cart/actions";
import { Product, ProductVariant } from "@/lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useCart } from "./cart-context";

function SubmitButton({ availableForSale, selectedVariantId }: { availableForSale: boolean; selectedVariantId: string | undefined }) {
  const buttonClasses = "relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!availableForSale) return <button disabled className={clsx(buttonClasses, disabledClasses)}>Out Of Stock</button>;
  if (!selectedVariantId) return <button disabled className={clsx(buttonClasses, disabledClasses)}>Add To Cart</button>;

  return (
    <button aria-label="Add to cart" className={clsx(buttonClasses, "hover:opacity-90")}>
      <div className="absolute left-0 ml-4"><PlusIcon className="h-5" /></div>
      Add To Cart
    </button>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const searchParams = useSearchParams();
  const [message, formAction] = useActionState(addItem, null);

  const variant = variants.find((v: ProductVariant) =>
    v.selectedOptions.every((option) => option.value === searchParams.get(option.name.toLowerCase()))
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const finalVariant = variants.find((v) => v.id === selectedVariantId)!;

  const addItemAction = formAction.bind(null, {
    productoId: product.id,
    varianteId: finalVariant.id,
    cantidad: 1,
  });

  return (
    <form action={async () => {
      addCartItem({
        productoId: product.id,
        varianteId: finalVariant.id,
        titulo: product.title,
        imagen: product.featuredImage?.url || null,
        varianteTitulo: finalVariant.title,
        precio: Number(finalVariant.price.amount),
      });
      addItemAction();
    }}>
      <SubmitButton availableForSale={availableForSale} selectedVariantId={selectedVariantId} />
      <p aria-live="polite" className="sr-only" role="status">{message}</p>
    </form>
  );
}