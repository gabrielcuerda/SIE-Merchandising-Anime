"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { removeItem } from "@/components/cart/actions";
import { useActionState } from "react";
import clsx from "clsx";
import { useFormStatus } from "react-dom";
import type { CarritoItem } from "@/lib/supabase/types";

export function DeleteItemButton({ item, optimisticUpdate }: { item: CarritoItem; optimisticUpdate: (itemId: string, updateType: "delete") => void }) {
  const { pending } = useFormStatus();
  const itemId = item.id;

  return (
    <form action={async () => {
      optimisticUpdate(itemId, "delete");
      await removeItem(null, itemId);
    }}>
      <button
        type="submit"
        aria-label="Remove cart item"
        className={clsx(
          "flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 text-white transition-all ease-in-out hover:scale-110 hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-300",
          { "cursor-not-allowed opacity-50": pending }
        )}
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </form>
  );
}
