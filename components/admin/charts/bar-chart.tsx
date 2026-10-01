import Link from "next/link";

/**
 * Gráfico de barras en SVG puro — sin dependencias externas.
 *
 * Cada barra lleva su `<title>`, de modo que el gráfico es navegable con
 * lector de pantalla (WCAG 1.1.1) sin necesidad de una tabla alternativa.
 */

export type BarDatum = {
  label: string;
  value: number;
  /** Texto completo para el tooltip/lector, p. ej. "1.234,00 €". */
  displayValue: string;
};

export function BarChart({
  data,
  title,
  description,
  height = 200,
}: {
  data: BarDatum[];
  title: string;
  description?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Todavía no hay datos suficientes para dibujar el gráfico.
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 28; // 28px reservados para las etiquetas del eje X
  const barGap = data.length > 8 ? 4 : 12;

  return (
    <figure className="px-5 py-5">
      <svg
        role="img"
        aria-label={description ? `${title}. ${description}` : title}
        viewBox={`0 0 ${data.length * 40} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full"
        style={{ maxHeight: height }}
      >
        <title>{title}</title>
        {description ? <desc>{description}</desc> : null}

        {data.map((datum, index) => {
          const barHeight = Math.max(
            (datum.value / max) * chartHeight,
            datum.value > 0 ? 2 : 0,
          );
          const x = index * 40 + barGap / 2;
          const y = chartHeight - barHeight;
          const width = 40 - barGap;

          return (
            <g key={datum.label}>
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                rx="3"
                className="fill-blue-600 transition-opacity hover:opacity-75 dark:fill-blue-500"
              >
                <title>{`${datum.label}: ${datum.displayValue}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex gap-4 overflow-x-auto text-xs text-neutral-500 dark:text-neutral-400">
        {data.map((datum) => (
          <span key={datum.label} className="shrink-0 whitespace-nowrap">
            {datum.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/**
 * Barra horizontal proporcional, para rankings compactos (top productos).
 * Se reserva el ancho de la etiqueta con un `<span>` flex, no con el SVG,
 * para que el texto no se deforme al hacer zoom.
 */
export function RankRow({
  rank,
  label,
  value,
  displayValue,
  max,
  href,
}: {
  rank: number;
  label: string;
  value: number;
  displayValue: string;
  max: number;
  href?: string;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <span className="w-5 shrink-0 text-right text-xs text-neutral-400 tabular-nums">
        {rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm text-neutral-800 dark:text-neutral-200">
            {href ? (
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            ) : (
              label
            )}
          </span>
          <span className="shrink-0 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
            {displayValue}
          </span>
        </span>
        <span
          aria-hidden
          className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
        >
          <span
            className="block h-full rounded-full bg-blue-600 dark:bg-blue-500"
            style={{ width: `${percentage}%` }}
          />
        </span>
      </span>
    </li>
  );
}
