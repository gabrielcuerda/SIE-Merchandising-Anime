# SIE Merchandising Anime

Tienda de merchandising de anime y manga importado directamente desde Japón.

## Stack

- Next.js 15 con App Router
- Supabase Auth, PostgreSQL y Storage
- Tailwind CSS v4
- TypeScript

## Desarrollo local

1. Instala las dependencias:

```bash
pnpm install
```

2. Configura `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
ADMIN_EMAILS=admin@ejemplo.com
PRIVACY_CONTROLLER_ADDRESS=TU_DIRECCION_POSTAL
PRIVACY_CONTROLLER_TAX_ID=TU_NIF_O_CIF
PRIVACY_EMAIL=privacidad@ejemplo.com
```

`ADMIN_EMAILS` es opcional y se utiliza para autorizar el acceso a `/admin`.

3. Inicia el servidor:

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Estructura

- `app`: rutas, páginas y layouts de Next.js
- `components`: componentes de interfaz
- `lib/commerce`: tipos y adaptadores de catálogo
- `lib/db`: consultas de productos, categorías, cuentas y pedidos
- `lib/supabase`: clientes browser/server y proxy de sesión
- `proxy.ts`: actualización de sesión y protección de rutas

## Supabase

Las tablas principales son `categorias`, `productos`, `producto_imagenes`, `producto_variantes`, `profiles`, `wishlist`, `pedidos` e `items_pedido`.

Activa Row Level Security para que cada usuario solo pueda modificar sus propios datos de cuenta, pedidos y lista de deseos. Las categorías, productos, imágenes y variantes pueden ser públicas para lectura.

En Supabase Auth configura las URLs de redirección permitidas:

- `http://localhost:3000/auth/callback`
- `https://TU-DOMINIO/auth/callback`

En Vercel añade las mismas variables de entorno para los entornos Production y Preview.

## Verificación

```bash
pnpm exec tsc --noEmit
pnpm run build
```
