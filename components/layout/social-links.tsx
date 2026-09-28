import { EnvelopeIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import SocialIcon from "components/icons/social";
import { siteConfig, type SiteSocial } from "@/lib/site";
import clsx from "clsx";

export function SocialLinks({
  socials = siteConfig.socials,
  className,
  iconClassName = "h-4 w-4",
  tone = "ink",
}: {
  socials?: readonly SiteSocial[];
  className?: string;
  iconClassName?: string;
  tone?: "ink" | "light";
}) {
  return (
    <ul className={clsx("flex items-center gap-2", className)}>
      {socials.map((social) => (
        <li key={social.name}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            title={social.name}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-md transition",
              tone === "light"
                ? "bg-ink-800 text-ink-200 hover:bg-brand-500 hover:text-white"
                : "border border-ink-200 text-ink-700 hover:border-brand-500 hover:bg-brand-500 hover:text-white",
            )}
          >
            <SocialIcon icon={social.icon} className={iconClassName} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ContactDetails({ className }: { className?: string }) {
  return (
    <ul className={clsx("space-y-3 text-sm", className)}>
      <li className="flex items-start gap-3">
        <EnvelopeIcon
          className="mt-0.5 h-4 w-4 flex-none text-brand-500"
          aria-hidden="true"
        />
        <a
          href={`mailto:${siteConfig.email}`}
          className="transition hover:text-brand-500"
        >
          {siteConfig.email}
        </a>
      </li>
      <li className="flex items-start gap-3">
        <PhoneIcon
          className="mt-0.5 h-4 w-4 flex-none text-brand-500"
          aria-hidden="true"
        />
        <a
          href={siteConfig.phoneHref}
          className="transition hover:text-brand-500"
        >
          {siteConfig.phone}
        </a>
      </li>
      <li className="flex items-start gap-3">
        <MapPinIcon
          className="mt-0.5 h-4 w-4 flex-none text-brand-500"
          aria-hidden="true"
        />
        <span>{siteConfig.address}</span>
      </li>
    </ul>
  );
}
