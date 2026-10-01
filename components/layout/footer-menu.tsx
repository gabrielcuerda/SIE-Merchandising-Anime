"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteLink } from "@/lib/site";

export function FooterLink({
  link,
  className,
}: {
  link: SiteLink;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === link.href;

  return (
    <li>
      <Link
        href={link.href}
        className={clsx(
          "inline-block py-1.5 text-sm transition hover:text-brand-400",
          isActive && "font-bold text-brand-400",
          className,
        )}
      >
        {link.label}
      </Link>
    </li>
  );
}

export default function FooterMenu({
  links,
  className,
}: {
  links: SiteLink[];
  className?: string;
}) {
  if (!links.length) return null;

  return (
    <ul className={clsx("space-y-0.5", className)}>
      {links.map((link) => (
        <FooterLink key={link.href} link={link} />
      ))}
    </ul>
  );
}
