import { siteConfig as SITE } from "@/lib/site";
import type { Cart, Menu, Page } from "./types";

function emptyCart(): Cart {
  return {
    id: "local-cart",
    checkoutUrl: "/account",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "EUR" },
      totalAmount: { amount: "0", currencyCode: "EUR" },
      totalTaxAmount: { amount: "0", currencyCode: "EUR" },
    },
  };
}

export async function getCart(): Promise<Cart> {
  return emptyCart();
}

export async function createCart(): Promise<Cart> {
  return emptyCart();
}

export async function addToCart(
  _lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  return emptyCart();
}

export async function removeFromCart(_lineIds: string[]): Promise<Cart> {
  return emptyCart();
}

export async function updateCart(
  _lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  return emptyCart();
}

export async function getMenu(_handle: string): Promise<Menu[]> {
  return [];
}

const pages: Record<string, Page> = {
  about: {
    title: "Sobre nosotros",
    body: "<p>Merchandising de anime y manga importado directamente desde Japón.</p>",
    bodySummary: "Merchandising de anime y manga importado desde Japón.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Sobre nosotros",
      description: "Merchandising de anime y manga importado desde Japón.",
    },
  },
  contacto: {
    title: "Contacto",
    body: "<p>Escríbenos para resolver tus dudas.</p>",
    bodySummary: "Información de contacto.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Contacto",
      description: "Información de contacto.",
    },
  },
  envios: {
    title: "Envíos y entregas",
    body: `<p>Enviamos a toda la península y a Europa con seguimiento.</p><ul><li>Entrega estándar en 24-48 h laborables.</li><li>Envío gratis en pedidos desde ${SITE.freeShippingThreshold} €.</li><li>Los pedidos confirmados antes de las 14:00 salen el mismo día.</li></ul>`,
    bodySummary: "Condiciones de envío, plazos y portes.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Envíos y entregas",
      description: "Plazos, portes y seguimiento de tu pedido.",
    },
  },
  devoluciones: {
    title: "Devoluciones",
    body: "<p>Tienes 30 días desde la recepción para devolver cualquier producto sin usar y en su embalaje original.</p><p>El reembolso se emite en un máximo de 7 días desde la recepción de la devolución.</p>",
    bodySummary: "Política de devoluciones y reembolsos.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Devoluciones",
      description: "Devuelve tu pedido en 30 días.",
    },
  },
  "preguntas-frecuentes": {
    title: "Preguntas frecuentes",
    body: "<h3>¿De dónde viene el producto?</h3><p>Todo el merchandising se importa directamente desde Japón a través de nuestros proveedores habituales.</p><h3>¿Los productos son originales?</h3><p>Sí, todas las piezas son originales yselladas.</p><h3>¿Puedo cancelar un pedido?</h3><p>Puedes cancelar tu pedido desde tu cuenta mientras no se haya enviado.</p>",
    bodySummary: "Respuestas a las dudas más habituales.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Preguntas frecuentes",
      description: "Todo lo que necesitas saber antes de comprar.",
    },
  },
  "aviso-legal": {
    title: "Aviso legal",
    body: `<p>${SITE.name}, con domicilio en ${SITE.address}.</p><p>Los precios se muestran en euros, IVA incluido. Las imágenes de producto son orientativas.</p>`,
    bodySummary: "Condiciones generales de uso de la tienda.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Aviso legal",
      description: "Condiciones generales de uso de la tienda.",
    },
  },
  privacidad: {
    title: "Política de privacidad",
    body: `<p>Tratamos los datos necesarios para gestionar tu pedido y tu cuenta en ${SITE.email}.</p><p>Puedes solicitar la exportación o la eliminación de tus datos en cualquier momento.</p>`,
    bodySummary: "Cómo tratamos tus datos personales.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Política de privacidad",
      description: "Cómo tratamos tus datos personales.",
    },
  },
  cookies: {
    title: "Política de cookies",
    body: "<p>Utilizamos cookies propias y de terceros para el funcionamiento de la tienda y con fines analíticos.</p>",
    bodySummary: "Información sobre el uso de cookies.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    seo: {
      title: "Política de cookies",
      description: "Información sobre el uso de cookies.",
    },
  },
};

export async function getPage(handle: string): Promise<Page | null> {
  return pages[handle] ?? null;
}

export async function getStaticPages(): Promise<Page[]> {
  return Object.values(pages);
}
