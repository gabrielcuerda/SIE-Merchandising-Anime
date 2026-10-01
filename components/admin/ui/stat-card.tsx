import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/solid";

export function Trend({
  value,
  direction,
}: {
  value: string;
  direction: "up" | "down" | "flat";
}) {
  if (direction === "flat") {
    return <span className="text-xs text-neutral-500">{value}</span>;
  }

  const Icon = direction === "up" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        direction === "up"
          ? "text-green-700 dark:text-green-400"
          : "text-red-700 dark:text-red-400"
      }`}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {value}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
          {label}
        </p>
        {icon ? <span className="text-neutral-400">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
        {value}
      </p>
      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend ? <Trend {...trend} /> : null}
          {hint ? (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {hint}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
