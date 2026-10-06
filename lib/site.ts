import { translate, type Lang } from "@/lib/i18n/dict";

export type SiteSocial = {
  name: string;
  href: string;
  icon: "instagram" | "youtube" | "tiktok" | "x" | "whatsapp" | "facebook";
};

export type SiteLink = {
  i18nKey?: string;
  label: string;
  href: string;
  description?: string;
};

export const siteConfig = {
  name: "Animemerchan",
  shortName: "Animemerchan",
  claim: "Merchandising de anime y manga importado de Japón",
  description:
    "Merchandising de anime y manga importado directamente desde Japón: figuras, manga, apparel y coleccionables para fans.",
  // Etiqueta BCP 47 con guion, NO `es_ES`: `Intl.NumberFormat` e
  // `Intl.DateTimeFormat` lanzan `RangeError: Incorrect locale information
  // provided` con el guion bajo. `lib/admin/formato.ts` la usa en el panel.
  locale: "es-ES",
  currency: "EUR",
  email: "hola@siemerchandising.es",
  phone: "+34 900 123 456",
  phoneHref: "tel:+34900123456",
  address: "Calle Mayor 1, 28013 Madrid, España",
  schedule: "Lunes a viernes, de 9:00 a 18:00",
  freeShippingThreshold: 60,
  freeShippingLabel: "Envío gratis",
  socials: [
    {
      name: "Instagram",
      href: "https://instagram.com/",
      icon: "instagram",
    },
    {
      name: "YouTube",
      href: "https://youtube.com/",
      icon: "youtube",
    },
    {
      name: "TikTok",
      href: "https://tiktok.com/",
      icon: "tiktok",
    },
    {
      name: "X",
      href: "https://x.com/",
      icon: "x",
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/34600000000",
      icon: "whatsapp",
    },
    {
      name: "Facebook",
      href: "https://facebook.com/",
      icon: "facebook",
    },
  ] satisfies SiteSocial[],
} as const;

export const mainNav: SiteLink[] = [
  { i18nKey: "nav.news", label: "Novedades", href: "/search?sort=latest-desc" },
  {
    i18nKey: "nav.bestSellers",
    label: "Más vendidos",
    href: "/search?sort=trending-desc",
  },
  { i18nKey: "nav.deals", label: "Ofertas", href: "/search?sort=price-asc" },
];

export type FooterColumn = {
  i18nKey: string;
  title: string;
  links: SiteLink[];
};

export const footerColumns: FooterColumn[] = [
  {
    i18nKey: "footer.col.info",
    title: "Información",
    links: [
      { i18nKey: "footer.info.about", label: "Sobre nosotros", href: "/about" },
      {
        i18nKey: "footer.info.shipping",
        label: "Envíos y entregas",
        href: "/envios",
      },
      {
        i18nKey: "footer.info.returns",
        label: "Devoluciones",
        href: "/devoluciones",
      },
      {
        i18nKey: "footer.info.faq",
        label: "Preguntas frecuentes",
        href: "/preguntas-frecuentes",
      },
    ],
  },
  {
    i18nKey: "footer.col.account",
    title: "Mi cuenta",
    links: [
      { i18nKey: "account.signIn", label: "Iniciar sesión", href: "/login" },
      { i18nKey: "account.register", label: "Crear cuenta", href: "/register" },
      {
        i18nKey: "account.orders",
        label: "Mis pedidos",
        href: "/account/orders",
      },
      {
        i18nKey: "account.wishlist",
        label: "Mi lista de deseos",
        href: "/wishlist",
      },
    ],
  },
  {
    i18nKey: "footer.col.legal",
    title: "Legal",
    links: [
      {
        i18nKey: "footer.legal.notice",
        label: "Aviso legal",
        href: "/aviso-legal",
      },
      {
        i18nKey: "footer.legal.privacy",
        label: "Política de privacidad",
        href: "/privacidad",
      },
      { i18nKey: "footer.legal.cookies", label: "Cookies", href: "/cookies" },
    ],
  },
];

export const paymentMethods = [
  "Visa",
  "Mastercard",
  "Bizum",
  "PayPal",
  "Transferencia",
];

export function traducirLink(lang: Lang, link: SiteLink): SiteLink {
  if (!link.i18nKey) return link;
  return { ...link, label: translate(lang, link.i18nKey) || link.label };
}

export function getMainNav(lang: Lang): SiteLink[] {
  return mainNav.map((link) => traducirLink(lang, link));
}

export function getFooterColumns(lang: Lang): FooterColumn[] {
  return footerColumns.map((column) => ({
    ...column,
    title: translate(lang, column.i18nKey) || column.title,
    links: column.links.map((link) => traducirLink(lang, link)),
  }));
}
