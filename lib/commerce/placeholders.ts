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
};

export async function getPage(handle: string): Promise<Page | null> {
  return pages[handle] ?? null;
}

export async function getStaticPages(): Promise<Page[]> {
  return Object.values(pages);
}
