export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
    serverActions: {
      // Las Server Actions esperan 1 MB por defecto, y las imágenes de
      // producto pueden llegar a 5 MB (`lib/admin/storage.ts`). El margen
      // cubre el sobrecoste de la codificación multipart.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",

        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
