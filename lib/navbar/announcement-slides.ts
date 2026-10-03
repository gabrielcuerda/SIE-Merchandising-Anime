import { translate, type Lang } from "@/lib/i18n/dict";

export type AnnounceIcon = "truck" | "return" | "card" | "import" | "academic";

export type AnnounceSlide = {
  id: string;
  icon: AnnounceIcon;
  href?: string;
  title: string;
  text: string;
  destacado?: boolean;
};

type RawSlide = Omit<AnnounceSlide, "title" | "text"> & {
  titleKey: string;
  textKey: string;
};

const rawSlides: RawSlide[] = [
  {
    id: "free",
    icon: "truck",
    href: "/envios",
    titleKey: "ship.free.title",
    textKey: "ship.free.text",
  },
  {
    id: "24h",
    icon: "truck",
    href: "/envios",
    titleKey: "ship.24h.title",
    textKey: "ship.24h.text",
  },
  {
    id: "dev",
    icon: "return",
    href: "/devoluciones",
    titleKey: "ship.dev.title",
    textKey: "ship.dev.text",
  },
  {
    id: "import",
    icon: "import",
    titleKey: "announce.import",
    textKey: "announce.from",
  },
  {
    id: "academic",
    icon: "academic",
    titleKey: "announce.academic.title",
    textKey: "announce.academic.text",
    destacado: true,
  },
];

export function getAnnounceSlides(lang: Lang): AnnounceSlide[] {
  return rawSlides.map((slide) => ({
    id: slide.id,
    icon: slide.icon,
    href: slide.href,
    destacado: slide.destacado,
    title: translate(lang, slide.titleKey),
    text: translate(lang, slide.textKey),
  }));
}
