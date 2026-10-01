"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { updateItemQuantity } from "@/components/cart/actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CarritoItem } from "@/lib/supabase/types";

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate,
}: {
  item: CarritoItem;
  type: "plus" | "minus";
  optimisticUpdate: (itemId: string, updateType: "plus" | "minus") => void;
}) {
  const { pending } = useFormStatus();
  const itemId = item.id;

  return (
    <form action={async () => {
      const newCantidad = type === "plus" ? item.cantidad + 1 : item.cantidad - 1;
      optimisticUpdate(itemId, type);
      await updateItemQuantity(null, { itemId, quantity: newCantidad });
    }}>
      <button
        type="submit"
        aria-label={
          type === "plus" ? "Increase item quantity" : "Decrease item quantity"
        }
        className={clsx(
          "flex h-full w-7 items-center justify-center rounded-full transition-all ease-in-out hover:scale-110 hover:bg-neutral-100 dark:hover:bg-neutral-800",
          { "cursor-not-allowed opacity-50": pending },
        )}
      >
        {type === "plus" ? (
          <PlusIcon className="h-3 w-3" />
        ) : (
          <MinusIcon className="h-3 w-3" />
        )}
      </button>
    </form>
  );
}
