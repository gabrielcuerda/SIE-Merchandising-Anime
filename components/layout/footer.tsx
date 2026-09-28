import {
  ArrowPathRoundedSquareIcon,
  CreditCardIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import Logo from "components/logo";
import FooterMenu from "components/layout/footer-menu";
import {
  ContactDetails,
  SocialLinks,
} from "components/layout/social-links";
import {
  siteConfig,
  footerColumns,
  shippingHighlights,
  type ShippingHighlight,
} from "@/lib/site";
import Link from "next/link";

const highlightIcons: Record<
  ShippingHighlight["icon"],
  React.ComponentType<React.ComponentProps<typeof TruckIcon>>
> = {
  truck: TruckIcon,
  return: ArrowPathRoundedSquareIcon,
  card: CreditCardIcon,
};

const paymentMethods = ["Visa", "Mastercard", "Bizum", "PayPal", "Transferencia"];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-ink-950 text-ink-300">
      {/* Información de envío */}
      <div className="border-b border-ink-800">
        <div className="page-container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {shippingHighlights.map((item) => {
            const Icon = highlightIcons[item.icon];

            return (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-ink-800 text-brand-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold tracking-wide text-white uppercase">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-400">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enlaces y datos de contacto */}
      <div className="page-container grid gap-10 py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link
            href="/"
            className="inline-flex rounded-lg transition hover:opacity-80"
            aria-label="SIE Merchandising, ir al inicio"
          >
            <Logo size="lg" tone="light" />
          </Link>

          <p className="mt-5 max-w-sm text-sm text-ink-400">
            {siteConfig.claim}. Piezas originales con garantía y envío
            rastreable desde nuestro almacén en Madrid.
          </p>

          <ContactDetails className="mt-6" />

          <SocialLinks tone="light" className="mt-6" />
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-extrabold tracking-[0.2em] text-white uppercase">
                {column.title}
              </h2>
              <FooterMenu links={column.links} className="mt-4" />
            </nav>
          ))}
        </div>
      </div>

      {/* Barra legal */}
      <div className="border-t border-ink-800">
        <div className="page-container flex flex-col gap-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Todos los derechos reservados.{" "}
            <Link
              href="/privacidad"
              className="underline underline-offset-4 transition hover:text-brand-400"
            >
              Privacidad
            </Link>{" "}
            ·{" "}
            <Link
              href="/cookies"
              className="underline underline-offset-4 transition hover:text-brand-400"
            >
              Cookies
            </Link>
          </p>

          <ul className="flex flex-wrap items-center gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-sm bg-ink-800 px-2 py-1 font-bold tracking-wide text-ink-300 uppercase"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
