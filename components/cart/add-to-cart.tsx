"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { addItem } from "@/components/cart/actions";
import { Product, ProductVariant } from "@/lib/commerce/types";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { useCart } from "./cart-context";

function SubmitButton({
  availableForSale,
  selectedVariantId,
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {
  const buttonClasses =
    "relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white";
  const disabledClasses = "cursor-not-allowed opacity-60 hover:opacity-60";

  if (!availableForSale)
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Agotado
      </button>
    );
  if (!selectedVariantId)
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Añadir al carrito
      </button>
    );

  return (
    <button aria-label="Add to cart" className={clsx(buttonClasses, "hover:opacity-90")}>
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5 w-5" />
      </div>
      Añadir al carrito
    </button>
  );
}

function QuantitySelector({
  cantidad,
  onChange,
}: {
  cantidad: number;
  onChange: (valor: number) => void;
}) {
  const boton =
    "px-3 py-2 text-neutral-500 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-white";

  return (
    <div className="mb-4 flex items-center gap-3">
      <label htmlFor="cantidad" className="text-sm font-medium">
        Cantidad
      </label>
      <div className="flex items-center rounded-full border border-neutral-300 dark:border-neutral-700">
        <button
          type="button"
          aria-label="Restar una unidad"
          onClick={() => onChange(cantidad - 1)}
          disabled={cantidad <= 1}
          className={boton}
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <input
          id="cantidad"
          type="number"
          min={1}
          max={99}
          value={cantidad}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-12 border-x border-neutral-300 bg-transparent py-2 text-center text-sm dark:border-neutral-700"
        />
        <button
          type="button"
          aria-label="Sumar una unidad"
          onClick={() => onChange(cantidad + 1)}
          className={boton}
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AddToCart({ product }: { product: Product }) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const searchParams = useSearchParams();
  const [message, formAction] = useActionState(addItem, null);
  const [cantidad, setCantidad] = useState(1);

  const variant = variants.find((v: ProductVariant) =>
    v.selectedOptions.every(
      (option) => option.value === searchParams.get(option.name.toLowerCase()),
    ),
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const finalVariant = variants.find((v) => v.id === selectedVariantId)!;

  if (!finalVariant) return null;

  const actualizarCantidad = (valor: number) => {
    if (Number.isNaN(valor)) return;
    setCantidad(Math.min(99, Math.max(1, valor)));
  };

  return (
    <form
      action={async () => {
        addCartItem({
          productoId: product.id,
          varianteId: finalVariant.id,
          titulo: product.title,
          imagen: product.featuredImage?.url || null,
          varianteTitulo: finalVariant.title,
          precio: Number(finalVariant.price.amount),
          cantidad,
        });
        formAction({
          productoId: product.id,
          varianteId: finalVariant.id,
          cantidad,
        });
      }}
    >
      <input type="hidden" name="productoId" value={product.id} />
      <input type="hidden" name="varianteId" value={finalVariant.id} />
      <input type="hidden" name="cantidad" value={cantidad} />
      <QuantitySelector cantidad={cantidad} onChange={actualizarCantidad} />
      <SubmitButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
