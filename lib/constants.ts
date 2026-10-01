export type SortFilterItem = {
  title: string;
  slug: string | null;
  sortKey: "RELEVANCE" | "BEST_SELLING" | "CREATED_AT" | "PRICE";
  reverse: boolean;
};

export const defaultSort: SortFilterItem = {
  title: "Relevance",
  slug: null,
  sortKey: "RELEVANCE",
  reverse: false,
};

export const sorting: SortFilterItem[] = [
  defaultSort,
  {
    title: "Trending",
    slug: "trending-desc",
    sortKey: "BEST_SELLING",
    reverse: false,
  }, // asc
  {
    title: "Latest arrivals",
    slug: "latest-desc",
    sortKey: "CREATED_AT",
    reverse: true,
  },
  {
    title: "Price: Low to high",
    slug: "price-asc",
    sortKey: "PRICE",
    reverse: false,
  }, // asc
  {
    title: "Price: High to low",
    slug: "price-desc",
    sortKey: "PRICE",
    reverse: true,
  },
];

export type ParamFilterItem = {
  title: string;
  param: string;
  value: string;
};

export const estados: ParamFilterItem[] = [
  { title: "En stock", param: "estado", value: "stock" },
  { title: "Pre-venta", param: "estado", value: "pre-venta" },
  { title: "Bajo pedido", param: "estado", value: "a-pedido" },
  { title: "Oferta", param: "estado", value: "oferta" },
];

export const precios: ParamFilterItem[] = [
  { title: "Menos de 150 €", param: "precio", value: "0-150" },
  { title: "150 € – 200 €", param: "precio", value: "150-200" },
  { title: "Más de 200 €", param: "precio", value: "200-" },
];

export const TAGS = {
  collections: "collections",
  products: "products",
  cart: "cart",
};

/** Solo lo usa la capa heredada de Shopify (lib/shopify). */
export const SHOPIFY_GRAPHQL_API_ENDPOINT = "/api/2024-01/graphql.json";

export const HIDDEN_PRODUCT_TAG = "nextjs-frontend-hidden";
export const DEFAULT_OPTION = "Default Title";
