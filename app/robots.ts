import { baseUrl } from "@/lib/utils";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas privadas: sin contenido indexable, sin usuarios anónimos
        // y sin datos personales que arrastre un buscador.
        disallow: ["/admin", "/admin/", "/account", "/account/", "/cart"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
