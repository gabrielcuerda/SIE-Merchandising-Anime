import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone =
  | "brand"
  | "ink"
  | "alert"
  | "success"
  | "warning"
  | "info"
  | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-500 text-white",
  ink: "bg-ink-950 text-white",
  alert: "bg-alert-500 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-ink-950",
  info: "bg-sky-600 text-white",
  neutral: "bg-ink-100 text-ink-700",
};

const dotClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-500",
  ink: "bg-ink-950",
  alert: "bg-alert-500",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  info: "bg-sky-600",
  neutral: "bg-ink-400",
};

export default function Badge({
  children,
  tone = "brand",
  size = "md",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-sm font-bold uppercase tracking-wide",
        toneClasses[tone],
        {
          "px-2 py-0.5 text-[10px]": size === "sm",
          "px-2.5 py-1 text-xs": size === "md",
          "px-3 py-1.5 text-sm": size === "lg",
        },
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={clsx("h-1.5 w-1.5 rounded-full", dotClasses[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}
