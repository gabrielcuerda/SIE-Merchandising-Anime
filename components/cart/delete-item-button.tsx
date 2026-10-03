"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { removeItem } from "./actions";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { CarritoItem } from "@/lib/supabase/types";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CarritoItem;
  /** Opcional: el modal del navbar sí lo usa para refrescar al instante. */
  optimisticUpdate?: (itemId: string, updateType: "delete") => void;
}) {
  const { pending } = useFormStatus();
  const itemId = item.id;

  return (
    <form
      action={async () => {
        optimisticUpdate?.(itemId, "delete");
        const result = await removeItem(null, itemId);
        if (!result.ok) toast.error(result.error ?? "No se ha podido borrar");
      }}
    >
      <button
        type="submit"
        aria-label="Quitar del carrito"
        disabled={pending}
        className={clsx(
          "flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 text-white transition-all ease-in-out hover:scale-110 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300",
        )}
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </form>
  );
}
