import { CartProvider } from "components/cart/cart-context";
import Footer from "components/layout/footer";
import { Navbar } from "components/layout/navbar";
import WelcomeToast from "components/welcome-toast";
import { GeistSans } from "geist/font/sans";

import { getCart } from "@/lib/commerce/placeholders";
import { siteConfig } from "@/lib/site";
import { baseUrl } from "@/lib/utils";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

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
  themeColor: "#ee7639",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="es" className={GeistSans.variable}>
      <body className="flex min-h-screen flex-col bg-white text-ink-950 selection:bg-brand-200 selection:text-ink-950">
        <CartProvider cartPromise={cart}>
          <Navbar />

          <main id="contenido" className="flex-1">
            {children}
          </main>

          <Footer />
        </CartProvider>

        <Toaster position="bottom-right" closeButton richColors />
        <WelcomeToast />
      </body>
    </html>
  );
}
