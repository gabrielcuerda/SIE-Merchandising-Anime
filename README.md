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

4. Aplica la migración del carrito y los pedidos. Es **obligatoria**: sin ella
   el botón de "Añadir al carrito" no hace nada, porque `carrito_items` tiene RLS
   activado y sin políticas de escritura.

```bash
# Copia el contenido de este fichero en Supabase Studio > SQL Editor > New query
supabase/migrations/20261003000000_carrito_pedidos.sql
```

Es idempotente, así que puedes ejecutarla más de una vez. Si PostgREST no la ve
todavía, es la caché de esquema: recarga el proyecto en el dashboard o espera
unos segundos.

5. Inicia el servidor:

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

Las tablas principales son `categorias`, `productos`, `producto_imagenes`, `producto_variantes`, `perfiles`, `wishlist`, `carrito_items`, `pedidos` e `items_pedido`.

Activa Row Level Security para que cada usuario solo pueda modificar sus propios datos de cuenta, pedidos y lista de deseos. Las categorías, productos, imágenes y variantes pueden ser públicas para lectura.

## Carrito y pago

El carrito **vive en Supabase**, no en el navegador:

- Con sesión iniciada se guarda en `carrito_items.user_id`.
- Sin sesión se guarda en `carrito_items.session_id`, un uuid que viaja en la
  cookie `cart_session_id`. Al iniciar sesión, `carrito_merge` traslada el
  carrito anónimo al del usuario sumando las líneas repetidas.

El acceso a la tabla se hace **solo** a través de funciones `SECURITY DEFINER`
(`carrito_*`, `crear_pedido`, `pedido_por_pago`) definidas en la migración. No es
capricho: RLS no puede contrastar el `session_id` de un visitante anónimo porque
no hay forma de validar un valor que llega en una cookie. Las funciones aplican
la regla de propiedad internamente y el RLS se queda activado sin políticas, de
modo que cualquier acceso directo a la tabla se deniega.

El pago usa **Stripe Checkout alojado**: `/checkout` pide la dirección de envío
y redirige a la página de Stripe, donde el cliente paga con tarjeta. Stripe crea
la factura y se la envía por email (`invoice_creation`). El importe se calcula
siempre en servidor a partir del carrito en base de datos; el cliente nunca
envía el total.

`productos.precio` se guarda **sin IVA**. El 21 % (`IVA_PORCENTAJE` en
`lib/constants.ts`) se aplica al calcular el total y se guarda desglosado en
`pedidos.direccion_pago`, porque la tabla no tiene columna de impuestos.

El pedido se crea con la función `crear_pedido`, que es **idempotente por
`pago_id`**: da igual que la cree el webhook de Stripe o la página de
confirmación, no se duplica ni se descuenta el stock dos veces.

### Webhook en desarrollo

`STRIPE_WEBHOOK_SECRET` del dashboard **no** sirve para desarrollo local. Con la
Stripe CLI instalada:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` que imprime a `.env.local` y reinicia el servidor. En
producción, registra `https://TU-DOMINIO/api/webhooks/stripe` en el dashboard
con el evento `checkout.session.completed`.

Aun sin webhook, la página de confirmación verifica el pago contra Stripe y
crea el pedido si aún no existe, así que no se pierde una compra.

En Supabase Auth configura las URLs de redirección permitidas:

- `http://localhost:3000/auth/callback`
- `https://TU-DOMINIO/auth/callback`

En Vercel añade las mismas variables de entorno para los entornos Production y Preview.

## Variables de entorno en Vercel

Vercel no lee `.env.local`, así que hay que declararlas en el dashboard:
**Project → Settings → Environment Variables**, en los entornos **Production** y **Preview**.

| Variable                               | Necesaria para                 |
| -------------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | toda la app                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | toda la app                    |
| `STRIPE_SECRET_KEY`                    | checkout                       |
| `STRIPE_WEBHOOK_SECRET`                | webhook de pagos               |
| `SITE_NAME`                            | nombre mostrado en la interfaz |
| `ADMIN_EMAILS`                         | acceso a `/admin`              |

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ya no se usa: el pago ocurre en la página
alojada de Stripe, así que no hay tarjeta dentro de la web.

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
