"use client";

import { toggleWishlist } from "@/app/wishlist/actions";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeartIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { MouseEvent, useState, useTransition } from "react";

type WishlistToggleProps = {
  productId: string;
  initialSaved?: boolean;
};

export default function WishlistToggle({
  productId,
  initialSaved = false,
}: WishlistToggleProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setError("");

    startTransition(async () => {
      const result = await toggleWishlist(productId, saved);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaved(result.saved ?? !saved);
      router.refresh();
    });
  }

  return (
    <div className="absolute right-2 top-2 z-10">
      <button
        className={`rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/90 ${
          saved ? "text-rose-500" : "text-neutral-500 hover:text-rose-500"
        }`}
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={saved ? "Quitar de favoritos" : "Añadir a favoritos"}
        aria-pressed={saved}
        title={saved ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        {saved ? (
          <SolidHeartIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <HeartIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {error ? (
        <span
          className="absolute right-0 top-12 w-48 rounded-md bg-red-50 p-2 text-xs text-red-700 shadow-sm dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
