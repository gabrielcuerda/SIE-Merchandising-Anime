import { getCategorias } from "@/lib/db/categorias";
import { getProductos } from "@/lib/db/productos";
import { baseUrl } from "@/lib/utils";
import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorias, productos] = await Promise.all([
    getCategorias().catch(() => []),
    getProductos({}).catch(() => []),
  ]);

  const now = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: now },
    { url: `${baseUrl}/search`, lastModified: now },
    ...categorias.map((categoria) => ({
      url: `${baseUrl}/search/${categoria.slug}`,
      lastModified: now,
    })),
    ...productos.map((producto) => ({
      url: `${baseUrl}/product/${producto.slug}`,
      lastModified: producto.updated_at,
    })),
    // Páginas legales y corporativas servidas por el catch-all `app/[page]`
    // y por la ruta dedicada `/privacidad`.
    { url: `${baseUrl}/privacidad`, lastModified: now },
    { url: `${baseUrl}/contacto`, lastModified: now },
    { url: `${baseUrl}/about`, lastModified: now },
  ];
}
