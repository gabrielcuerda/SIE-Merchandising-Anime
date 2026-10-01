import clsx from "clsx";
import type { ComponentProps } from "react";

export default function Separator({
  orientation = "horizontal",
  label,
  spacing = "md",
  className,
  ...props
}: ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  label?: string;
  spacing?: "sm" | "md" | "lg";
}) {
  if (label) {
    return (
      <div
        {...props}
        role="separator"
        aria-orientation="horizontal"
        className={clsx("flex items-center gap-3", className)}
      >
        <span
          className={clsx("h-px flex-1 bg-ink-200", {
            "my-6": spacing === "lg",
            "my-4": spacing === "md",
            "my-3": spacing === "sm",
          })}
        />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink-400">
          {label}
        </span>
        <span
          className={clsx("h-px flex-1 bg-ink-200", {
            "my-6": spacing === "lg",
            "my-4": spacing === "md",
            "my-3": spacing === "sm",
          })}
        />
      </div>
    );
  }

  return (
    <div
      {...props}
      role="separator"
      aria-orientation={orientation}
      className={clsx(
        orientation === "vertical" ? "w-px self-stretch" : "h-px w-full",
        "bg-ink-200",
        className,
      )}
    />
  );
}
