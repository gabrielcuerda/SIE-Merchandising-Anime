export type HeroSlide = {
  id: string;
  eyebrow: string; // texto pequeño superior (badge)
  title: string; // titular grande
  description: string; // párrafo
  ctaLabel: string; // texto del botón
  ctaHref: string; // a dónde lleva el botón
  background: string; // clases de Tailwind del degradado
  accent: string; // clases del badge
};

/** Cada cuánto cambia la diapositiva sola (ms) */
export const HERO_INTERVAL_MS = 6000;

export const heroSlides: HeroSlide[] = [
  {
    id: "importado-japon",
    eyebrow: "Importado directamente de Japón",
    title: "Figuras de acción y coleccionables de anime",
    description:
      "Figuras y coleccionables de tus franquicias favoritas, seleccionados uno a uno y enviados desde Japón.",
    ctaLabel: "Ver catálogo",
    ctaHref: "/search",
    background: "from-brand-200 via-brand-100 to-brand-50",
    accent: "bg-brand-500 text-white",
  },
  {
    id: "novedades",
    eyebrow: "Recién llegados",
    title: "Novedades de la temporada",
    description:
      "Los últimos lanzamientos de Dragon Ball, One Piece, Attack on Titan, Naruto y muchas más franquicias.",
    ctaLabel: "Ver novedades",
    ctaHref: "/search?sort=latest-desc",
    background: "from-brand-100 via-brand-50 to-orange-100",
    accent: "bg-ink-950 text-white",
  },
  {
    id: "franquicias",
    eyebrow: "Colección por franquicia",
    title: "Encuentra tu saga favorita",
    description:
      "Dragon Ball, One Piece, Attack on Titan, Naruto, Jujutsu Kaisen, Demon Slayer y Chainsaw Man, organizados por franquicia.",
    ctaLabel: "Explorar Dragon Ball",
    ctaHref: "/search/dragon-ball",
    background: "from-brand-300 via-brand-100 to-brand-50",
    accent: "bg-brand-600 text-white",
  },
];

import { translate, type Lang } from "@/lib/i18n/dict";

/** Devuelve las diapositivas traducidas al idioma pedido. */
export function getHeroSlides(lang: Lang): HeroSlide[] {
  return heroSlides.map((slide) => ({
    ...slide,
    eyebrow: translate(lang, `hero.${slide.id}.eyebrow`) || slide.eyebrow,
    title: translate(lang, `hero.${slide.id}.title`) || slide.title,
    description:
      translate(lang, `hero.${slide.id}.description`) || slide.description,
    ctaLabel: translate(lang, `hero.${slide.id}.ctaLabel`) || slide.ctaLabel,
  }));
}
