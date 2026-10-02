export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "es";

const es = {
  // ── Barra de anuncios (Fase 1) ──
  "ship.free.title": "Envío gratis",
  "ship.free.text": "En pedidos desde 60 €",
  "ship.24h.title": "Entrega en 24-48 h",
  "ship.24h.text": "Península y Europa con seguimiento",
  "ship.dev.title": "Devolución en 30 días",
  "ship.dev.text": "Sin preguntas y sin coste",
  "ship.pay.title": "Pago seguro",
  "ship.pay.text": "Tarjeta, Bizum y transferencia",
  "announce.import": "Importación directa",
  "announce.from": "desde Japón",

  // ── Buscador (Fase 1) ──
  "search.label": "Buscar productos",
  "search.placeholder": "Busca figuras, manga, apparel...",
  "search.submit": "Buscar",

  // ── Navbar (Fase 1) ──
  "nav.home": "SIE Merchandising, ir al inicio",
  "nav.account": "Mi cuenta",
  "nav.wishlist": "Lista de deseos",

  // ── Hero carousel ──
  "hero.importado-japon.eyebrow": "Importado directamente de Japón",
  "hero.importado-japon.title": "Figuras de acción y coleccionables de anime",
  "hero.importado-japon.description":
    "Figuras y coleccionables de tus franquicias favoritas, seleccionados uno a uno y enviados desde Japón.",
  "hero.importado-japon.ctaLabel": "Ver catálogo",
  "hero.novedades.eyebrow": "Recién llegados",
  "hero.novedades.title": "Novedades de la temporada",
  "hero.novedades.description":
    "Los últimos lanzamientos de Dragon Ball, One Piece, Attack on Titan, Naruto y muchas más franquicias.",
  "hero.novedades.ctaLabel": "Ver novedades",
  "hero.franquicias.eyebrow": "Colección por franquicia",
  "hero.franquicias.title": "Encuentra tu saga favorita",
  "hero.franquicias.description":
    "Dragon Ball, One Piece, Attack on Titan, Naruto, Jujutsu Kaisen, Demon Slayer y Chainsaw Man, organizados por franquicia.",
  "hero.franquicias.ctaLabel": "Explorar Dragon Ball",
  "hero.prev": "Diapositiva anterior",
  "hero.next": "Diapositiva siguiente",
  "hero.dot": "Ir a la diapositiva",

  // ── Secciones del home ──
  "home.bestSellers.title": "Más vendidos",
  "home.bestSellers.subtitle":
    "Ordenado por las unidades vendidas en pedidos confirmados",
  "home.bestSellers.cta": "Ver los más vendidos",
  "home.news.title": "Novedades",
  "home.news.subtitle": "Lo último que ha llegado al catálogo",
  "home.news.cta": "Ver novedades",
  "home.offers.title": "Ofertas",
  "home.offers.subtitle": "Precios rebajados mientras dure la promoción",
  "home.offers.cta": "Ver todo el catálogo",
  "home.offers.empty": "Ahora mismo no hay ofertas activas. ¡Vuelve pronto!",
  "home.allProducts": "Todos los productos",
  "common.viewAll": "Ver todo",

  // ── Banners de franquicia ──
  "promo.franchise": "Franquicia",
  "promo.figure.one": "figura",
  "promo.figure.other": "figuras",
  "promo.onSale": "en oferta",
  "promo.viewFigures": "Ver figuras",
  "promo.title": "Explora por franquicia",
  "promo.subtitle": "Elige la serie que buscas y ve directo a sus figuras",
  "promo.viewAll": "Ver todo el catálogo",
  "promo.aria": "Banners promocionales por franquicia",

  // ── Estados de producto ──
  "status.stock": "En stock",
  "status.preVenta": "Pre-venta",
  "status.aPedido": "Bajo pedido",
  "status.oferta": "Oferta",
  "status.agotado": "Agotado",

  // ── Navbar ──
  "nav.homeLink": "Inicio",
  "nav.news": "Novedades",
  "nav.bestSellers": "Más vendidos",
  "nav.deals": "Ofertas",
  "nav.allCategories": "Todas las categorías",
  "nav.freeShippingFrom": "Envío gratis desde",
  "nav.ariaCategories": "Categorías y navegación principal",
  "nav.loadingCategories": "Estamos cargando las categorías. Mientras tanto,",
  "nav.browseCatalog": "mira todo el catálogo",
  "nav.viewFullCatalog": "Ver el catálogo completo →",

  // ── Menú móvil ──
  "menu.open": "Abrir menú",
  "menu.close": "Cerrar menú",
  "menu.title": "Menú",
  "menu.ariaMobile": "Menú móvil",
  "menu.viewSubcategories": "Ver subcategorías de",

  // ── Cuenta ──
  "account.myAccount": "Mi cuenta",
  "account.orders": "Mis pedidos",
  "account.wishlist": "Mi lista de deseos",
  "account.signIn": "Iniciar sesión",
  "account.register": "Crear cuenta",

  // ── Footer ──
  "footer.claim": "Merchandising de anime y manga importado de Japón. Piezas originales con garantía y envío rastreable desde nuestro almacén en Madrid.",
  "footer.rights": "Todos los derechos reservados.",
  "footer.col.info": "Información",
  "footer.col.account": "Mi cuenta",
  "footer.col.legal": "Legal",
  "footer.info.about": "Sobre nosotros",
  "footer.info.shipping": "Envíos y entregas",
  "footer.info.returns": "Devoluciones",
  "footer.info.faq": "Preguntas frecuentes",
  "footer.legal.notice": "Aviso legal",
  "footer.legal.privacy": "Política de privacidad",
  "footer.legal.cookies": "Cookies",
  "site.address": "Calle Mayor 1, 28013 Madrid, España",
  
} as const;

export type DictKey = keyof typeof es;

const en: Record<DictKey, string> = {
  // Announcement bar
  "ship.free.title": "Free shipping",
  "ship.free.text": "On orders from 60 €",
  "ship.24h.title": "Delivery in 24-48 h",
  "ship.24h.text": "Spain and Europe with tracking",
  "ship.dev.title": "30-day returns",
  "ship.dev.text": "No questions asked, no cost",
  "ship.pay.title": "Secure payment",
  "ship.pay.text": "Card, Bizum and bank transfer",
  "announce.import": "Direct import",
  "announce.from": "from Japan",

  // Search
  "search.label": "Search products",
  "search.placeholder": "Search figures, manga, apparel...",
  "search.submit": "Search",

  // Navbar
  "nav.home": "SIE Merchandising, go to home",
  "nav.account": "My account",
  "nav.wishlist": "Wishlist",

  // Hero carousel
  "hero.importado-japon.eyebrow": "Directly imported from Japan",
  "hero.importado-japon.title": "Action figures and anime collectibles",
  "hero.importado-japon.description":
    "Figures and collectibles from your favourite franchises, hand-picked and shipped from Japan.",
  "hero.importado-japon.ctaLabel": "View catalogue",
  "hero.novedades.eyebrow": "Just arrived",
  "hero.novedades.title": "New arrivals this season",
  "hero.novedades.description":
    "The latest releases from Dragon Ball, One Piece, Attack on Titan, Naruto and many more franchises.",
  "hero.novedades.ctaLabel": "View new arrivals",
  "hero.franquicias.eyebrow": "Shop by franchise",
  "hero.franquicias.title": "Find your favourite saga",
  "hero.franquicias.description":
    "Dragon Ball, One Piece, Attack on Titan, Naruto, Jujutsu Kaisen, Demon Slayer and Chainsaw Man, organised by franchise.",
  "hero.franquicias.ctaLabel": "Explore Dragon Ball",
  "hero.prev": "Previous slide",
  "hero.next": "Next slide",
  "hero.dot": "Go to slide",

  // Home sections
  "home.bestSellers.title": "Best sellers",
  "home.bestSellers.subtitle": "Sorted by units sold in confirmed orders",
  "home.bestSellers.cta": "View best sellers",
  "home.news.title": "New arrivals",
  "home.news.subtitle": "The latest to reach the catalogue",
  "home.news.cta": "View new arrivals",
  "home.offers.title": "Deals",
  "home.offers.subtitle": "Reduced prices while the promotion lasts",
  "home.offers.cta": "View full catalogue",
  "home.offers.empty": "There are no active deals right now. Come back soon!",
  "home.allProducts": "All products",
  "common.viewAll": "View all",

  // Franchise banners
  "promo.franchise": "Franchise",
  "promo.figure.one": "figure",
  "promo.figure.other": "figures",
  "promo.onSale": "on sale",
  "promo.viewFigures": "View figures",
  "promo.title": "Browse by franchise",
  "promo.subtitle": "Pick the series you want and go straight to its figures",
  "promo.viewAll": "View full catalogue",
  "promo.aria": "Promotional banners by franchise",

  // Product status
  "status.stock": "In stock",
  "status.preVenta": "Pre-order",
  "status.aPedido": "Backorder",
  "status.oferta": "Deal",
  "status.agotado": "Sold out",

  // Navbar
  "nav.homeLink": "Home",
  "nav.news": "New arrivals",
  "nav.bestSellers": "Best sellers",
  "nav.deals": "Deals",
  "nav.allCategories": "All categories",
  "nav.freeShippingFrom": "Free shipping from",
  "nav.ariaCategories": "Categories and main navigation",
  "nav.loadingCategories": "We are loading the categories. In the meantime,",
  "nav.browseCatalog": "browse the full catalogue",
  "nav.viewFullCatalog": "View the full catalogue →",

  // Mobile menu
  "menu.open": "Open menu",
  "menu.close": "Close menu",
  "menu.title": "Menu",
  "menu.ariaMobile": "Mobile menu",
  "menu.viewSubcategories": "View subcategories of",

  // Account
  "account.myAccount": "My account",
  "account.orders": "My orders",
  "account.wishlist": "My wishlist",
  "account.signIn": "Sign in",
  "account.register": "Create account",

  // Footer
  "footer.claim": "Anime and manga merchandise imported from Japan. Original pieces with warranty and tracked shipping from our Madrid warehouse.",
  "footer.rights": "All rights reserved.",
  "footer.col.info": "Information",
  "footer.col.account": "My account",
  "footer.col.legal": "Legal",
  "footer.info.about": "About us",
  "footer.info.shipping": "Shipping & delivery",
  "footer.info.returns": "Returns",
  "footer.info.faq": "FAQ",
  "footer.legal.notice": "Legal notice",
  "footer.legal.privacy": "Privacy policy",
  "footer.legal.cookies": "Cookies",
  "site.address": "Calle Mayor 1, 28013 Madrid, Spain",
  
};

export const dict: Record<Lang, Record<DictKey, string>> = { es, en };

export function translate(lang: Lang, key: string): string {
  const k = key as DictKey;
  return dict[lang][k] ?? dict.es[k] ?? "";
}