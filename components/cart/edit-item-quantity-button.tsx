"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { updateItemQuantity } from "./actions";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { CarritoItem } from "@/lib/supabase/types";

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate,
}: {
  item: CarritoItem;
  type: "plus" | "minus";
  /** Opcional: el modal del navbar sí lo usa para refrescar al instante. */
  optimisticUpdate?: (itemId: string, updateType: "plus" | "minus") => void;
}) {
  const { pending } = useFormStatus();
  const itemId = item.id;

  return (
    <form
      action={async () => {
        const nuevaCantidad =
          type === "plus" ? item.cantidad + 1 : item.cantidad - 1;

        optimisticUpdate?.(itemId, type);

        const result = await updateItemQuantity(null, {
          itemId,
          cantidad: nuevaCantidad,
        });

        if (!result.ok) {
          toast.error(result.error ?? "No se ha podido cambiar la cantidad");
        }
      }}
    >
      <button
        type="submit"
        aria-label={type === "plus" ? "Aumentar cantidad" : "Reducir cantidad"}
        disabled={pending}
        className={clsx(
          "flex h-full w-7 items-center justify-center rounded-full transition-all ease-in-out hover:scale-110 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800",
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
