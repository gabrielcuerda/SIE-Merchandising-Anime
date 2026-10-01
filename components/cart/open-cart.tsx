import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function OpenCart({
  className,
  quantity,
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    <span
      className={clsx(
        "relative flex h-10 w-10 items-center justify-center rounded-md bg-ink-950 text-white transition hover:bg-brand-500 lg:h-11 lg:w-11",
        className,
      )}
    >
      <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />

      {quantity ? (
        <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {quantity}
        </span>
      ) : null}
    </span>
  );
}
