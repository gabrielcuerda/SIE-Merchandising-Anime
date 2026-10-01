import type { Producto } from "@/lib/db/types";
import Badge, { type BadgeTone } from "./badge";

/** Etiquetas de estado de stock según el esquema de `productos.status`. */
const statusMeta: Record<
  Producto["status"],
  { label: string; tone: BadgeTone }
> = {
  oferta: { label: "Oferta", tone: "brand" },
  stock: { label: "En stock", tone: "success" },
  "pre-venta": { label: "Próximamente", tone: "info" },
  "a-pedido": { label: "Bajo pedido", tone: "warning" },
};

export function ProductStatusBadge({
  status,
  className,
}: {
  status: Producto["status"];
  className?: string;
}) {
  const meta = statusMeta[status];

  if (!meta) return null;

  return (
    <Badge tone={meta.tone} size="sm" className={className}>
      {meta.label}
    </Badge>
  );
}

export function getProductStatusLabel(status: Producto["status"]) {
  return statusMeta[status]?.label ?? "";
}
