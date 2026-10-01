import { getProducto, getProductos } from "@/lib/db/productos";
import type {
  Producto,
  ProductoImagen,
  ProductoVariante,
} from "@/lib/db/types";
import type { Image, Product, ProductOption, ProductVariant } from "./types";

const placeholderImage: Image = {
  url: "/placeholder.svg",
  altText: "Imagen no disponible",
  width: 1200,
  height: 1200,
};

type ProductoConDetalle = Producto & {
  producto_imagenes: ProductoImagen[];
  producto_variantes: ProductoVariante[];
};

function mapImages(producto: ProductoConDetalle): Image[] {
  const images = [...(producto.producto_imagenes || [])]
    .sort((a, b) => a.orden_cat - b.orden_cat)
    .map((image) => ({
      url: image.url,
      altText: image.alt_text || producto.titulo,
      width: 1200,
      height: 1200,
    }));

  return images.length > 0 ? images : [placeholderImage];
}

function mapProduct(producto: ProductoConDetalle): Product {
  type SourceVariant = Pick<
    ProductoVariante,
    "id" | "titulo" | "precio" | "stock" | "opciones"
  >;

  const sourceVariants: SourceVariant[] = producto.producto_variantes?.length
    ? producto.producto_variantes
    : [
        {
          id: producto.id,
          titulo: "Default Title",
          precio: producto.precio,
          stock: producto.stock,
          opciones: [],
        },
      ];

  const variants: ProductVariant[] = sourceVariants.map((variant) => ({
    id: variant.id,
    title: variant.titulo,
    availableForSale: variant.stock > 0 || producto.status !== "stock",
    selectedOptions: variant.opciones || [],
    price: {
      amount: String(variant.precio),
      currencyCode: "EUR",
    },
  }));

  const optionMap = new Map<string, Set<string>>();
  variants.forEach((variant) => {
    variant.selectedOptions.forEach((option) => {
      const values = optionMap.get(option.name) || new Set<string>();
      values.add(option.value);
      optionMap.set(option.name, values);
    });
  });

  const options: ProductOption[] = Array.from(optionMap.entries()).map(
    ([name, values]) => ({
      id: `${producto.id}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      values: Array.from(values),
    }),
  );

  const prices = variants.map((variant) => Number(variant.price.amount));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const images = mapImages(producto);

  return {
    id: producto.id,
    handle: producto.slug,
    title: producto.titulo,
    description: producto.descripcion || "",
    descriptionHtml: producto.descripcion || "",
    availableForSale: producto.stock > 0 || producto.status !== "stock",
    featuredImage: images[0] || placeholderImage,
    images,
    options,
    variants,
    priceRange: {
      minVariantPrice: { amount: String(minPrice), currencyCode: "EUR" },
      maxVariantPrice: { amount: String(maxPrice), currencyCode: "EUR" },
    },
    seo: {
      title: producto.titulo,
      description: producto.descripcion || producto.titulo,
    },
    tags: producto.tags || [],
    createdAt: producto.created_at,
    updatedAt: producto.updated_at,
  };
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const producto = await getProducto(handle);
  return producto ? mapProduct(producto as ProductoConDetalle) : undefined;
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  const productos = await getProductos({});
  return productos
    .filter((producto) => producto.id !== productId)
    .slice(0, 4)
    .map((producto) =>
      mapProduct({
        ...producto,
        producto_variantes: [],
      } as ProductoConDetalle),
    );
}
