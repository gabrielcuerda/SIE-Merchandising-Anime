
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
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
ADMIN_EMAILS=admin@ejemplo.com
```

`SUPABASE_SERVICE_ROLE_KEY` es obligatoria para usar `/admin` y **no** debe
llevar el prefijo `NEXT_PUBLIC_`. `ADMIN_EMAILS` es opcional: también vale
marcar `app_metadata.role = 'admin'` en Supabase Auth.

3. Aplica los scripts SQL de `supabase/sql/` (ver **Base de datos**).

4. Inicia el servidor:

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Estructura

- `app`: rutas, páginas y layouts de Next.js
- `app/admin`: panel de administración (resumen, productos, categorías, pedidos, usuarios)
- `components`: componentes de interfaz
- `lib/commerce`: tipos y adaptadores de catálogo
- `lib/db`: consultas de productos, categorías, cuentas y pedidos
- `lib/db/admin`: consultas privilegiadas del panel admin (usan la service role)
- `lib/supabase`: clientes browser/server/admin y proxy de sesión
- `supabase/sql`: scripts SQL que se aplican a mano en Supabase
- `proxy.ts`: actualización de sesión y protección de rutas

## Supabase

Las tablas principales son `categorias`, `productos`, `producto_imagenes`, `producto_variantes`, `profiles`, `wishlist`, `carrito_items`, `pedidos` e `items_pedido`.

Activa Row Level Security para que cada usuario solo pueda modificar sus propios datos de cuenta, pedidos y lista de deseos. Las categorías, productos, imágenes y variantes pueden ser públicas para lectura. Los scripts concretos están en `supabase/sql/`.

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
| `SUPABASE_SERVICE_ROLE_KEY` | panel admin (`/admin`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | checkout |
| `STRIPE_SECRET_KEY` | checkout |
| `STRIPE_WEBHOOK_SECRET` | webhook de pagos |
| `SITE_NAME` | nombre mostrado en la interfaz |
| `COMPANY_NAME` | titular del copyright y responsable del tratamiento |
| `ADMIN_EMAILS` | acceso a `/admin` |
| `REVALIDATE_SECRET` | `POST /api/revalidate` |
| `PRIVACY_EMAIL` | contacto en `/privacidad` (si falta, se enlaza a `/contacto`) |
| `PRIVACY_CONTROLLER_ADDRESS` | dirección del responsable en `/privacidad` |
| `PRIVACY_CONTROLLER_TAX_ID` | identificación fiscal en `/privacidad` |

> **Importante:** `NEXT_PUBLIC_*` se sustituye por su valor **durante el build**.
> Si cambias o añades una de estas variables, tienes que **hacer un redeploy**;
> si no, el build seguirá usando el valor anterior.

> **Importante:** `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe llevar el prefijo
> `NEXT_PUBLIC_`. Esa clave ignora Row Level Security, así que si acaba en el
> bundle del navegador cualquier visitante podría leer y escribir toda la base
> de datos. Sólo se usa en Server Actions y Server Components.

Si falta alguna variable requerida, el build falla con un mensaje que indica
cuál es y dónde añadirla (`lib/supabase/env.ts`, `lib/stripe.ts`,
`lib/supabase/admin.ts`).

## Base de datos

No hay carpeta de migraciones: los scripts SQL se aplican a mano desde
**Supabase → SQL Editor**, en este orden la primera vez:

1. `supabase/sql/001_admin_rls.sql` — Row Level Security (catálogo público de
   lectura, datos personales aislados por usuario) e índices del panel admin.
2. `supabase/sql/002_storage.sql` — bucket público `productos` para las
   imágenes que se suben desde `/admin/productos`.

Ambos scripts son **idempotentes**: se pueden volver a ejecutar sin romper nada.

> ⚠️ `001_admin_rls.sql` también es un **arreglo de seguridad**. Sin él, la
> clave `publishable` (rol `anon`) que usa la app puede leer la tabla `pedidos`
> completa desde el navegador — emails, direcciones e importes de todos los
> clientes — lo que contradice la política de privacidad publicada.

## Páginas legales

- `/privacidad` — política de privacidad (RGPD), ruta dedicada con su propio
  `layout.tsx`. Lee `PRIVACY_EMAIL`, `PRIVACY_CONTROLLER_ADDRESS` y
  `PRIVACY_CONTROLLER_TAX_ID`; si faltan, la página degrada a un enlace a
  `/contacto` en lugar de mostrar placeholders vacíos.
- `/contacto` y `/about` — servidas por el catch-all `app/[page]`, cuyos
  textos están en `lib/commerce/placeholders.ts`.

Ambas están enlazadas desde el footer, que se renderiza en todas las páginas.

## Panel de administración

`/admin` está protegido por rol en `proxy.ts` (`lib/supabase/roles.ts`): sin
sesión redirige a `/login`, y con sesión sin rol admin redirige a `/account`.
Un usuario es admin si tiene `app_metadata.role = 'admin'` en Supabase Auth o si
su email está en `ADMIN_EMAILS`.

Secciones: **Resumen** (métricas), **Productos** (CRUD con subida de imágenes a
Supabase Storage), **Categorías** (árbol con jerarquía), **Pedidos** (estado y
número de seguimiento) y **Usuarios** (perfil, historial y promoción a admin).

> `proxy.ts` no es una frontera de seguridad: una Server Action se puede invocar
> por HTTP directamente. Por eso **toda** action de admin vuelve a validar la
> sesión con `assertAdmin()` (`lib/supabase/require-admin.ts`) antes de tocar la
> base de datos.

## Revalidar la tienda

`POST /api/revalidate` fuerza `revalidatePath("/", "layout")`. Está fuera de
`/admin` y lo puede llamar cualquiera, así que exige `REVALIDATE_SECRET` en la
cabecera `x-revalidate-secret`; sin la variable configurada responde `503`.

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET"
```

Las mutaciones del panel admin ya llaman a `revalidatePath` por su cuenta: este
endpoint es para forzar un revalidado tras un despliegue.


## Verificación

```bash
pnpm exec tsc --noEmit
pnpm run build
```
