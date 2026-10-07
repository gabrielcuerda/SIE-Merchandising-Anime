import clsx from "clsx";
import LogoMark from "./icons/logo";
import { siteConfig } from "@/lib/site";

/** Sello circular con el símbolo. Disco azul profundo + monograma en oro. */
export function LogoBadge({
  size = "md",
  tone = "dark",
  className,
}: {
  size?: "sm" | "md" | "lg";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "flex flex-none items-center justify-center rounded-full text-ki-400",
        {
          "h-8 w-8": size === "sm",
          "h-10 w-10": size === "md",
          "h-12 w-12": size === "lg",
          "bg-blue-950 ring-2 ring-ki-400": tone === "dark",
          "bg-blue-800 ring-1 ring-blue-900 ring-inset": tone === "light",
        },
        className,
      )}
    >
      <LogoMark
        aria-hidden="true"
        className={clsx({
          "h-5 w-5": size === "sm",
          "h-6 w-6": size === "md",
          "h-7 w-7": size === "lg",
        })}
      />
    </span>
  );
}

/** Bloque de texto con el nombre de la marca. */
export function LogoWordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light" | "gold";
}) {
  return (
    <span className={clsx("flex items-center gap-2 leading-none", className)}>
      <span
        className={clsx(
          "font-display text-xl font-extrabold tracking-[-0.03em]",
          tone === "light"
            ? "text-white"
            : tone === "gold"
              ? "text-ki-400"
              : "text-ink-950",
        )}
      >
        {siteConfig.name}
      </span>
    </span>
  );
}

/** Lockup completo: badge + wordmark. */
export default function Logo({
  size = "md",
  withWordmark = true,
  tone = "dark",
  className,
}: {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <LogoBadge size={size} tone={tone} />
      {withWordmark ? <LogoWordmark tone={tone} /> : null}
    </span>
  );
}
