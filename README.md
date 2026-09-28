
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

2. Configura `.env.local` (copia `.env.example`):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
ADMIN_EMAILS=admin@ejemplo.com
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

## Variables de entorno en Vercel

Vercel no lee `.env.local`, así que hay que declararlas en el dashboard:
**Project → Settings → Environment Variables**, en los entornos **Production** y **Preview**.

| Variable | Necesaria para |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | toda la app |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | toda la app |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | checkout |
| `STRIPE_SECRET_KEY` | checkout |
| `STRIPE_WEBHOOK_SECRET` | webhook de pagos |
| `SITE_NAME` | nombre mostrado en la interfaz |
| `ADMIN_EMAILS` | acceso a `/admin` |

> **Importante:** `NEXT_PUBLIC_*` se sustituye por su valor **durante el build**.
> Si cambias o añades una de estas variables, tienes que **hacer un redeploy**;
> si no, el build seguirá usando el valor anterior.

Si falta alguna variable requerida, el build falla con un mensaje que indica
cuál es y dónde añadirla (`lib/supabase/env.ts`, `lib/stripe.ts`).

## Verificación

```bash
pnpm exec tsc --noEmit
pnpm run build
```
