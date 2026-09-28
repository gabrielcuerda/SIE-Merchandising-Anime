import clsx from "clsx";
import LogoMark from "./icons/logo";
import { siteConfig } from "@/lib/site";

/** Sello circular con el símbolo. Negro de marca + monograma naranja. */
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
        "flex flex-none items-center justify-center rounded-full text-brand-500",
        {
          "h-8 w-8": size === "sm",
          "h-10 w-10": size === "md",
          "h-12 w-12": size === "lg",
          "bg-ink-950": tone === "dark",
          "bg-ink-900 ring-1 ring-ink-800 ring-inset": tone === "light",
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

/** Bloque de texto: "SIE" + filete naranja + "MERCHANDISING". */
export function LogoWordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={clsx("flex items-center gap-2 leading-none", className)}>
      <span
        className={clsx(
          "font-display text-xl font-extrabold tracking-[-0.03em]",
          tone === "light" ? "text-white" : "text-ink-950",
        )}
      >
        {siteConfig.shortName}
      </span>
      <span aria-hidden="true" className="h-4 w-px bg-brand-500" />
      <span
        className={clsx(
          "font-display text-[11px] font-bold tracking-[0.22em] uppercase",
          tone === "light" ? "text-ink-400" : "text-ink-500",
        )}
      >
        Merchandising
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
