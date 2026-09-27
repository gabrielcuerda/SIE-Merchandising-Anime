export type HeroSlide = {
  id: string;
  eyebrow: string;      // texto pequeño superior (badge)
  title: string;        // titular grande
  description: string;  // párrafo
  ctaLabel: string;     // texto del botón
  ctaHref: string;      // a dónde lleva el botón
  background: string;   // clases de Tailwind del degradado
  accent: string;       // clases del badge
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
    background: "from-sky-200 via-sky-100 to-indigo-200",
    accent: "bg-sky-700 text-white",
  },
  {
    id: "novedades",
    eyebrow: "Recién llegados",
    title: "Novedades de la temporada",
    description:
      "Los últimos lanzamientos de Dragon Ball, One Piece, Attack on Titan, Naruto y muchas más franquicias.",
    ctaLabel: "Ver novedades",
    ctaHref: "/search?sort=latest-desc",
    background: "from-violet-200 via-fuchsia-100 to-sky-100",
    accent: "bg-violet-700 text-white",
  },
  {
    id: "franquicias",
    eyebrow: "Colección por franquicia",
    title: "Encuentra tu saga favorita",
    description:
      "Dragon Ball, One Piece, Attack on Titan, Naruto, Jujutsu Kaisen, Demon Slayer y Chainsaw Man, organizados por franquicia.",
    ctaLabel: "Explorar Dragon Ball",
    ctaHref: "/search/dragon-ball",
    background: "from-emerald-200 via-teal-100 to-sky-100",
    accent: "bg-emerald-700 text-white",
  },
];