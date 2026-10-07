import { CartProvider } from "components/cart/cart-context";
import Footer from "components/layout/footer";
import { Navbar } from "components/layout/navbar";
import CookieBanner from "components/cookies/cookie-banner";
import { GeistSans } from "geist/font/sans";

import { siteConfig } from "@/lib/site";
import { baseUrl } from "@/lib/utils";
import { getCart } from "lib/cart";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/language-context";
import { getLang } from "@/lib/i18n/lang";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export const viewport = {
  themeColor: "#ff6b00",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // El carrito se resuelve AQUÍ y no dentro del provider: pasar la promesa hacia
  // el cliente obligaba a leerla con `use()`, que durante la hidratación genera
  // un árbol distinto al que se envió y rompe el render del header. Ver el
  // comentario de `CartProvider`.
  const cart = await getCart();
  const lang = await getLang();

  return (
    <html lang={lang} className={GeistSans.variable}>
      <body className="flex min-h-screen flex-col bg-white text-ink-950 selection:bg-ki-300 selection:text-ink-950">
        <LanguageProvider initialLang={lang}>
          <CartProvider cart={cart}>
            <Navbar />

            <main id="contenido" className="flex-1">
              {children}
            </main>

            <Footer />
          </CartProvider>

          <Toaster position="bottom-right" closeButton richColors />
          <CookieBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
