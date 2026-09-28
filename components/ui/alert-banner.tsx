import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "error" | "brand";

const toneStyles: Record<AlertTone, { wrapper: string; icon: string }> = {
  brand: {
    wrapper: "border-brand-200 bg-brand-50 text-brand-900",
    icon: "text-brand-600",
  },
  info: {
    wrapper: "border-sky-200 bg-sky-50 text-sky-900",
    icon: "text-sky-600",
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-600",
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
  },
  error: {
    wrapper: "border-alert-200 bg-alert-50 text-alert-900",
    icon: "text-alert-500",
  },
};

const toneIcons: Record<AlertTone, typeof InformationCircleIcon> = {
  brand: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

export default function AlertBanner({
  children,
  tone = "info",
  title,
  icon = true,
  action,
  className,
}: {
  children: ReactNode;
  tone?: AlertTone;
  title?: string;
  icon?: boolean;
  action?: { label: string; href: string };
  className?: string;
}) {
  const Icon = toneIcons[tone];
  const styles = toneStyles[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex flex-col gap-2 rounded-card border px-4 py-3 sm:flex-row sm:items-center sm:gap-3",
        styles.wrapper,
        className,
      )}
    >
      {icon ? (
        <Icon className={clsx("h-5 w-5 flex-none", styles.icon)} aria-hidden="true" />
      ) : null}

      <div className="flex-1 text-sm">
        {title ? <p className="font-bold">{title}</p> : null}
        <div className={clsx(title && "mt-0.5 opacity-90")}>{children}</div>
      </div>

      {action ? (
        <Link
          href={action.href}
          className="inline-flex flex-none items-center gap-1 self-start text-sm font-bold underline-offset-4 hover:underline sm:self-auto"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
