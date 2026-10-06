# Animemerchan

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

`ADMIN_EMAILS` es opcional y da acceso a la **interfaz** de `/admin`, pero no a
los datos: la base de datos solo acepta el rol `admin` en `app_metadata` (ver el
paso 4). Es una lista de emails de despliegue, no un mecanismo de permisos.

3. Aplica las migraciones de la base de datos. Es **obligatorio** y van **en
   orden**, porque cada una da por hecho que la anterior ya está aplicada:

   | Fichero                                                         | Qué se rompe sin él                                                                                                                                                                     |
   | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `supabase/migrations/20261003000000_carrito_pedidos.sql`        | «Añadir al carrito» no hace nada: `carrito_items` tiene RLS activado y sin políticas de escritura.                                                                                      |
   | `supabase/migrations/20261004000000_admin_p5.sql`               | El panel `/admin` no carga nada: **ninguna** función `admin_*` existe en la base de datos.                                                                                              |
   | `supabase/migrations/20261005000000_eventos.sql`                | La tabla `eventos` no se crea y la instrumentación del embudo de compra no registra.                                                                                                    |
   | `supabase/migrations/20261006000000_admin_pedidos_perfiles.sql` | El listado de pedidos del panel falla con `PGRST200`: no hay relación `pedidos` → `perfiles`. Además `perfiles` se queda vacía y los formularios de perfil y dirección no guardan nada. |

   Se ejecutan desde **Supabase Studio → SQL Editor → New query**: copias el
   contenido del fichero y pulsas _Run_. Las tres son idempotentes, así que
   puedes ejecutarlas las veces que haga falta.

4. Concede el rol de administrador a la cuenta que va a entrar al panel. La
   migración anterior crea `is_admin()` y `require_admin()`, y las dos miran
   **solo** el claim `role` de `app_metadata`: sin él, todas las funciones del
   panel fallan con _No tienes permisos_. `ADMIN_EMAILS` no cuenta.

   En Supabase Studio → Authentication → Users, edita el usuario y pon
   `app_metadata` = `{"role":"admin"}`. O por SQL:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || jsonb_build_object('role', 'admin')
   where email = 'TU_EMAIL';
   ```

   Después **cierra sesión y vuelve a entrar**: el claim va dentro del JWT firmado
   y una sesión ya abierta no lo ve. Mientras el rol venga solo de
   `ADMIN_EMAILS`, el panel muestra un aviso naranja en la parte superior.

   Para confirmar que las migraciones se aplicaron de verdad:

   ```sql
   -- Debe existir el bucket 'productos': lo crea la migración del panel
   select id, public from storage.buckets;
   ```

   Si una RPC responde `Could not find the function ... in the schema cache`, la
   función existe pero PostgREST todavía no la ha visto: recarga el esquema con

   ```sql
   notify pgrst, 'reload schema';
   ```

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
