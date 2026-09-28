import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-card border border-ink-200 bg-white shadow-card",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={clsx("p-5 pb-0", className)} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      {...props}
      className={clsx("text-lg font-extrabold tracking-tight", className)}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p {...props} className={clsx("mt-1 text-sm text-ink-500", className)} />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={clsx("p-5", className)} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        "flex items-center gap-3 border-t border-ink-200 p-5",
        className,
      )}
    />
  );
}

export function CardLink({
  children,
  className,
  ...props
}: ComponentProps<typeof Card> & { children: ReactNode }) {
  return (
    <Card
      {...props}
      className={clsx(
        "block transition duration-200 hover:-translate-y-1 hover:border-brand-500 hover:shadow-float",
        className,
      )}
    >
      {children}
    </Card>
  );
}
