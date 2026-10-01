import clsx from "clsx";
import type { Producto } from "@/lib/db/types";

type Status = Producto["status"];

// Record<Status, ...> obliga a definir TODOS los estados:
// si mañana añades uno nuevo en lib/db/types.ts, aquí te saltará un error.
const ESTADOS: Record<Status, { texto: string; clases: string }> = {
  stock: { texto: "En stock", clases: "bg-emerald-600 text-white" },
  "pre-venta": { texto: "Pre-venta", clases: "bg-amber-400 text-black" },
  "a-pedido": { texto: "Bajo pedido", clases: "bg-sky-600 text-white" },
  oferta: { texto: "Oferta", clases: "bg-rose-600 text-white" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const estado = ESTADOS[status];

  return (
    <span
      className={clsx(
        "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-wider shadow-md",
        estado.clases,
      )}
    >
      {estado.texto}
    </span>
  );
}