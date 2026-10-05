import { Card, CardContent } from "@/components/ui";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export type StatTone = "neutro" | "marca" | "alerta" | "exito" | "info";

const TONE_CLASES: Record<StatTone, { valor: string; acento: string }> = {
  neutro: { valor: "text-ink-950", acento: "bg-ink-400" },
  marca: { valor: "text-brand-600", acento: "bg-brand-500" },
  alerta: { valor: "text-alert-600", acento: "bg-alert-500" },
  exito: { valor: "text-ink-950", acento: "bg-brand-500" },
  info: { valor: "text-ink-950", acento: "bg-ink-400" },
};

/**
 * Tarjeta de métrica del dashboard.
 *
 * Compone `Card` de `@/components/ui` en lugar de reimplementar el borde, la
 * sombra y el radio: si la paleta cambia, cambia en un solo sitio.
 *
 * Con `href` es un enlace (`CardLink`), sin él es un `article`. El degradado de
 * a11y se apoya en que el valor es el contenido principal del enlace.
 */
export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "neutro",
  icono,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  tone?: StatTone;
  icono?: ReactNode;
}) {
  const clases = TONE_CLASES[tone];

  const contenido = (
    <>
      <span
        aria-hidden="true"
        className={clsx("absolute inset-x-0 top-0 h-1", clases.acento)}
      />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-ink-500">{label}</p>
          {icono ? (
            <span aria-hidden="true" className="shrink-0 text-ink-300">
              {icono}
            </span>
          ) : null}
        </div>
        <p
          className={clsx(
            "mt-2 text-3xl font-extrabold tracking-tight",
            clases.valor,
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="relative h-full transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-float">
          {contenido}
        </Card>
      </Link>
    );
  }

  return <Card className="relative h-full">{contenido}</Card>;
}
