export type SiteSocial = {
  name: string;
  href: string;
  icon: "instagram" | "youtube" | "tiktok" | "x" | "whatsapp" | "facebook";
};

export type SiteLink = {
  label: string;
  href: string;
  description?: string;
};

export const siteConfig = {
  name: "SIE Merchandising",
  shortName: "SIE",
  claim: "Merchandising de anime y manga importado de Japón",
  description:
    "Merchandising de anime y manga importado directamente desde Japón: figuras, manga, apparel y coleccionables para fans.",
  locale: "es_ES",
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
  { label: "Novedades", href: "/search?sort=latest-desc" },
  { label: "Más vendidos", href: "/search?sort=trending-desc" },
  { label: "Ofertas", href: "/search?sort=price-asc" },
];

export const footerColumns: { title: string; links: SiteLink[] }[] = [
  {
    title: "Información",
    links: [
      { label: "Sobre nosotros", href: "/about" },
      { label: "Envíos y entregas", href: "/envios" },
      { label: "Devoluciones", href: "/devoluciones" },
      { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
    ],
  },
  {
    title: "Mi cuenta",
    links: [
      { label: "Iniciar sesión", href: "/login" },
      { label: "Crear cuenta", href: "/register" },
      { label: "Mis pedidos", href: "/account/orders" },
      { label: "Mi lista de deseos", href: "/wishlist" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso legal", href: "/aviso-legal" },
      { label: "Política de privacidad", href: "/privacidad" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

export type ShippingHighlight = {
  title: string;
  text: string;
  icon: "truck" | "return" | "card";
};

export const shippingHighlights: ShippingHighlight[] = [
  {
    title: siteConfig.freeShippingLabel,
    text: `En pedidos desde ${siteConfig.freeShippingThreshold} €`,
    icon: "truck",
  },
  {
    title: "Entrega en 24-48 h",
    text: "Península y Europa con seguimiento",
    icon: "truck",
  },
  {
    title: "Devolución en 30 días",
    text: "Sin preguntas y sin coste",
    icon: "return",
  },
  {
    title: "Pago seguro",
    text: "Tarjeta, Bizum y transferencia",
    icon: "card",
  },
];

export const paymentMethods = [
  "Visa",
  "Mastercard",
  "Bizum",
  "PayPal",
  "Transferencia",
];
