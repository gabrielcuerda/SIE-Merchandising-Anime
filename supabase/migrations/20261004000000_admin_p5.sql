-- ============================================================================
-- SIE Merchandising Anime — Panel de administración (P5)
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Por qué funciones SECURITY DEFINER y no políticas RLS:
--   el rol de administrador vive en `auth.users.raw_app_meta_data`, un claim que
--   Supabase Auth firma dentro del JWT. Una política RLS podría leerlo con
--   `auth.jwt()`, pero para las tablas del panel necesitamos además (a) escribir
--   en varias tablas dentro de una misma operación atómica —validar y luego
--   insertar— y (b) leer `auth.users`, que está fuera del alcance del rol
--   `authenticated` y solo es accesible con `service_role`.
--
--   El patrón que seguimos es el mismo que el de `20261003000000_carrito_pedidos`:
--   el cliente NUNCA escribe directamente. Llama a una función SECURITY DEFINER
--   que valida el rol con `require_admin()` y aplica la regla internamente.
--   Ventaja adicional: la regla de negocio (unicidad de slug, ciclos en el árbol
--   de categorías, no borrar un producto que aparece en el histórico) queda
--   escrita una sola vez, en SQL, y no puede saltarse desde el cliente.
--
--   El guard de `proxy.ts` en el repositorio NO protege las Server Actions: es
--   solo navegación HTTP. Esta capa es la que de verdad protege los datos.
--
-- Orden de ejecución: es un único script, puedes ejecutarlo entero de una vez.
-- ============================================================================


-- ============================================================================
-- 1. Autenticación del administrador
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 is_admin()
--     Única fuente de verdad en la base de datos. Refleja exactamente lo que
--     hace `isAdminUser()` en `lib/supabase/middleware.ts`: el claim `role` de
--     app_metadata. La lista de emails (`ADMIN_EMAILS`) es deliberadamente
--     solo del lado de la aplicación: es una variable de entorno de despliegue y
--     meterla en la BD obligaría a reescribir la tabla en cada cambio de equipo.
--     Consecuencia: un email que solo esté en ADMIN_EMAILS puede entrar en /admin
--     pero sus escrituras fallarán. Para darle acceso de verdad hay que poner
--     `app_metadata = {"role":"admin"}` en el usuario desde Supabase Studio.
-- ----------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'),
    false
  );
$$;


-- ----------------------------------------------------------------------------
-- 1.2 require_admin()
--     Primera sentencia de TODAS las funciones admin. 42501 es
--     `insufficient_privilege`, que PostgREST propaga tal cual: así la capa de
--     actions puede distinguir "no tienes permiso" de "los datos son inválidos"
--     y mostrar un mensaje útil en lugar de un error genérico.
-- ----------------------------------------------------------------------------

create or replace function public.require_admin(p_accion text default null)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acceso restringido al panel de administración.'
      using errcode = '42501';
  end if;
end;
$$;


-- ----------------------------------------------------------------------------
-- 1.3 Validación de imagen
--     El bucket filtra por `allowed_mime_types`, pero esa comprobación ocurre en
--     la capa de Storage. Aquí la repetimos porque el cliente puede enviar
--     cualquier `url` por RPC sin pasar por Storage.
-- ----------------------------------------------------------------------------

create or replace function public.admin_validar_url_imagen(p_url text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_url text;
begin
  if p_url is null or btrim(p_url) = '' then
    raise exception 'La URL de la imagen es obligatoria.';
  end if;

  v_url := btrim(p_url);

  if v_url !~ '^https://[^[:space:]]+$' then
    raise exception 'La URL de la imagen no es válida.';
  end if;

  if lower(v_url) !~ '\.(png|jpe?g|webp|avif|gif)$' then
    raise exception 'Formato de imagen no admitido. Usa PNG, JPEG, WebP, AVIF o GIF.';
  end if;

  return v_url;
end;
$$;


-- ============================================================================
-- 2. Row Level Security del catálogo y de los datos de usuario
--
--    Estado previo (comprobado por sonda contra PostgREST): el catálogo se lee
--    sin sesión y `perfiles` / `wishlist` responden a peticiones anónimas, lo que
--    apunta a RLS sin activar en esas tablas. Sin RLS, `anon` puede leer y
--    escribir cualquier fila. Lo corregimos aquí.
--
--    Para no romper el catálogo público, cada tabla de lectura pública recibe
--    una política SELECT explícita. Activar RLS sin más habría dejado la tienda
--    entera sin productos.
-- ============================================================================

alter table public.categorias        enable row level security;
alter table public.productos         enable row level security;
alter table public.producto_imagenes enable row level security;
alter table public.producto_variantes enable row level security;
alter table public.perfiles          enable row level security;
alter table public.wishlist          enable row level security;
alter table public.pedidos           enable row level security;
alter table public.items_pedido      enable row level security;

-- --- Catálogo: lectura pública -------------------------------------------
-- El catálogo se renderiza en servidor (SEO) y es público por naturaleza, igual
-- que un Shopify de catálogo abierto. Solo lectura; nunca escritura desde anon.

drop policy if exists "categorias_select_publico" on public.categorias;
create policy "categorias_select_publico" on public.categorias
  for select to anon, authenticated using (true);

drop policy if exists "productos_select_publico" on public.productos;
create policy "productos_select_publico" on public.productos
  for select to anon, authenticated using (true);

drop policy if exists "producto_imagenes_select_publico" on public.producto_imagenes;
create policy "producto_imagenes_select_publico" on public.producto_imagenes
  for select to anon, authenticated using (true);

drop policy if exists "producto_variantes_select_publico" on public.producto_variantes;
create policy "producto_variantes_select_publico" on public.producto_variantes
  for select to anon, authenticated using (true);

-- --- Perfiles: su dueño, y cualquier admin -------------------------------
-- Antes esto era legible y escribible por `anon`. Ahora cada usuario solo ve y
-- modifica el suyo, y el panel de administración necesita leerlos todos para la
-- gestión de usuarios, de ahí la segunda política.

drop policy if exists "perfiles_select_propio" on public.perfiles;
create policy "perfiles_select_propio" on public.perfiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "perfiles_select_admin" on public.perfiles;
create policy "perfiles_select_admin" on public.perfiles
  for select to authenticated using (public.is_admin());

drop policy if exists "perfiles_insert_propio" on public.perfiles;
create policy "perfiles_insert_propio" on public.perfiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "perfiles_update_propio" on public.perfiles;
create policy "perfiles_update_propio" on public.perfiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- --- Wishlist: solo su dueño ---------------------------------------------

drop policy if exists "wishlist_select_propio" on public.wishlist;
create policy "wishlist_select_propio" on public.wishlist
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "wishlist_insert_propio" on public.wishlist;
create policy "wishlist_insert_propio" on public.wishlist
  for insert to authenticated with check (usuario_id = auth.uid());

drop policy if exists "wishlist_delete_propio" on public.wishlist;
create policy "wishlist_delete_propio" on public.wishlist
  for delete to authenticated using (usuario_id = auth.uid());

-- --- Pedidos: su dueño o un admin ----------------------------------------
-- `pedidos_select_propio` e `items_pedido_select_propio` ya existen desde la
-- migración del carrito. Añadimos la variante admin para el panel.

drop policy if exists "pedidos_select_admin" on public.pedidos;
create policy "pedidos_select_admin" on public.pedidos
  for select to authenticated using (public.is_admin());

drop policy if exists "items_pedido_select_admin" on public.items_pedido;
create policy "items_pedido_select_admin" on public.items_pedido
  for select to authenticated using (public.is_admin());


-- ============================================================================
-- 3. Bucket de imágenes
--
--    No existía ningún bucket en el proyecto, así que no había forma de subir
--    imágenes. Lo creamos aquí, en la misma migración, para que la subida de
--    imágenes del panel quede cubierta por las mismas políticas que el resto.
--
--    Es público porque el catálogo lo consume `next/image` sin sesión. La
--    `images.remotePatterns` de `next.config.ts` ya permite
--    `https://**.supabase.co/storage/v1/object/public/**`, así que no hay que
--    tocar la configuración de Next.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'productos',
  'productos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- La lectura no necesita policy: en un bucket público Supabase sirve el objeto
-- por su URL pública sin pasar por PostgREST.

drop policy if exists "productos_insert_admin" on storage.objects;
create policy "productos_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "productos_update_admin" on storage.objects;
create policy "productos_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "productos_delete_admin" on storage.objects;
create policy "productos_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and public.is_admin());


-- ============================================================================
-- 4. Productos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 admin_producto_create
-- ----------------------------------------------------------------------------

create or replace function public.admin_producto_create(
  p_titulo text,
  p_slug text,
  p_descripcion text default null,
  p_precio numeric default null,
  p_categoria_id uuid default null,
  p_status text default 'stock',
  p_stock integer default 0,
  p_destacado boolean default false,
  p_sku text default null,
  p_tags text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_slug text;
begin
  perform public.require_admin('crear producto');

  if p_titulo is null or btrim(p_titulo) = '' then
    raise exception 'El título del producto es obligatorio.';
  end if;

  v_slug := lower(btrim(coalesce(p_slug, '')));
  if v_slug = '' then
    raise exception 'El identificador del producto es obligatorio.';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'El identificador solo puede contener letras minúsculas, números y guiones.';
  end if;

  if p_precio is null or p_precio < 0 then
    raise exception 'El precio no puede ser negativo.';
  end if;

  if coalesce(p_status, 'stock') not in ('stock', 'pre-venta', 'a-pedido', 'oferta') then
    raise exception 'El estado del producto no es válido.';
  end if;

  if exists (select 1 from public.productos where slug = v_slug) then
    raise exception 'Ya existe un producto con el identificador "%".', v_slug;
  end if;

  if p_categoria_id is not null
     and not exists (select 1 from public.categorias where id = p_categoria_id) then
    raise exception 'La categoría seleccionada no existe.';
  end if;

  insert into public.productos (
    titulo, slug, descripcion, precio, categoria_id,
    status, stock, destacado, sku, tags
  )
  values (
    btrim(p_titulo), v_slug,
    nullif(btrim(coalesce(p_descripcion, '')), ''),
    p_precio, p_categoria_id,
    coalesce(p_status, 'stock'), greatest(coalesce(p_stock, 0), 0),
    coalesce(p_destacado, false),
    nullif(btrim(coalesce(p_sku, '')), ''),
    p_tags
  )
  returning id into v_id;

  return v_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 4.2 admin_producto_update
--     El slug solo se toca si viene informado: regenerarlo en cada edición
--     rompería las URLs ya publicadas yindexadas.
-- ----------------------------------------------------------------------------

create or replace function public.admin_producto_update(
  p_id uuid,
  p_titulo text,
  p_slug text default null,
  p_descripcion text default null,
  p_precio numeric default null,
  p_categoria_id uuid default null,
  p_status text default 'stock',
  p_stock integer default 0,
  p_destacado boolean default false,
  p_sku text default null,
  p_tags text[] default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  perform public.require_admin('editar producto');

  if not exists (select 1 from public.productos where id = p_id) then
    raise exception 'El producto no existe.';
  end if;

  if p_titulo is null or btrim(p_titulo) = '' then
    raise exception 'El título del producto es obligatorio.';
  end if;

  if p_precio is null or p_precio < 0 then
    raise exception 'El precio no puede ser negativo.';
  end if;

  if coalesce(p_status, 'stock') not in ('stock', 'pre-venta', 'a-pedido', 'oferta') then
    raise exception 'El estado del producto no es válido.';
  end if;

  if p_categoria_id is not null
     and not exists (select 1 from public.categorias where id = p_categoria_id) then
    raise exception 'La categoría seleccionada no existe.';
  end if;

  v_slug := nullif(lower(btrim(coalesce(p_slug, ''))), '');
  if v_slug is not null then
    if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'El identificador solo puede contener letras minúsculas, números y guiones.';
    end if;
    if exists (select 1 from public.productos where slug = v_slug and id <> p_id) then
      raise exception 'Ya existe un producto con el identificador "%".', v_slug;
    end if;
  end if;

  update public.productos
  set titulo       = btrim(p_titulo),
      slug         = coalesce(v_slug, slug),
      descripcion  = nullif(btrim(coalesce(p_descripcion, '')), ''),
      precio       = p_precio,
      categoria_id = p_categoria_id,
      status       = coalesce(p_status, 'stock'),
      stock        = greatest(coalesce(p_stock, 0), 0),
      destacado    = coalesce(p_destacado, false),
      sku          = nullif(btrim(coalesce(p_sku, '')), ''),
      tags         = p_tags,
      updated_at   = now()
  where id = p_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 4.3 admin_producto_delete
--
--     Devuelve las rutas de Storage que la action debe borrar, porque el
--     borrado de objetos en Storage no se puede encadenar desde SQL de forma
--     fiable y `items_pedido` debe sobrevivir: es el histórico de ventas.
--
--     Por eso NO borramos `items_pedido`. Sus snapshots (`titulo_producto`,
--     `img_producto`, `precio`) existen justamente para que un pedido siga
--     siendo legible aunque el producto desaparezca del catálogo.
-- ----------------------------------------------------------------------------

create or replace function public.admin_producto_delete(p_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rutas text[];
  v_base text;
begin
  perform public.require_admin('eliminar producto');

  if not exists (select 1 from public.productos where id = p_id) then
    raise exception 'El producto no existe.';
  end if;

  -- De URL pública a ruta de objeto: quitamos el prefijo de la URL del bucket.
  select coalesce(
           (
             select array_agg(
               regexp_replace(
                 im.url,
                 '^https?://[^/]+/storage/v1/object/public/productos/',
                 ''
               )
             )
             from public.producto_imagenes im
             where im.producto_id = p_id
           ),
           '{}'::text[]
         )
  into v_rutas;

  v_base := 'productos/' || p_id::text || '/';

  delete from public.producto_imagenes where producto_id = p_id;
  delete from public.producto_variantes where producto_id = p_id;

  -- Fuera del catálogo, pero dentro del historial de pedidos: se desvincula.
  update public.items_pedido set producto_id = null where producto_id = p_id;

  delete from public.productos where id = p_id;

  -- Solo devolvemos rutas que estén realmente dentro de nuestra carpeta, para
  -- que la action nunca pueda borrar algo ajeno por un dato manipulado.
  return coalesce(
    (
      select array_agg(r)
      from unnest(v_rutas) as r
      where r like v_base || '%'
    ),
    '{}'::text[]
  );
end;
$$;


-- ----------------------------------------------------------------------------
-- 4.4 admin_producto_set_destacado
--     Acción rápida del listado, sin abrir el formulario.
-- ----------------------------------------------------------------------------

create or replace function public.admin_producto_set_destacado(
  p_id uuid,
  p_destacado boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('destacar producto');

  if not exists (select 1 from public.productos where id = p_id) then
    raise exception 'El producto no existe.';
  end if;

  update public.productos
  set destacado = coalesce(p_destacado, false), updated_at = now()
  where id = p_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 4.5 admin_producto_set_stock
--     Reposición de stock tras una cancelación. Es una acción explícita, no un
--     trigger: `crear_pedido` descuenta stock pero nada lo repone, y un trigger
--     silencioso haría imposible auditar por qué volvió a aparecer una unidad.
-- ----------------------------------------------------------------------------

create or replace function public.admin_producto_set_stock(
  p_id uuid,
  p_stock integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('ajustar stock');

  if not exists (select 1 from public.productos where id = p_id) then
    raise exception 'El producto no existe.';
  end if;

  if p_stock is null or p_stock < 0 then
    raise exception 'El stock no puede ser negativo.';
  end if;

  update public.productos
  set stock = p_stock, updated_at = now()
  where id = p_id;
end;
$$;


-- ============================================================================
-- 5. Imágenes de producto
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 admin_imagen_add
--     `orden_cat` empieza en 1, igual que en `categorias`.
-- ----------------------------------------------------------------------------

create or replace function public.admin_imagen_add(
  p_producto_id uuid,
  p_url text,
  p_alt_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_orden integer;
  v_url text;
begin
  perform public.require_admin('añadir imagen');

  if not exists (select 1 from public.productos where id = p_producto_id) then
    raise exception 'El producto no existe.';
  end if;

  v_url := public.admin_validar_url_imagen(p_url);

  select coalesce(max(im.orden_cat), 0) + 1
  into v_orden
  from public.producto_imagenes im
  where im.producto_id = p_producto_id;

  insert into public.producto_imagenes (producto_id, url, alt_text, orden_cat)
  values (p_producto_id, v_url, nullif(btrim(coalesce(p_alt_text, '')), ''), v_orden)
  returning id into v_id;

  return v_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 5.2 admin_imagen_delete
--     Devuelve la ruta de Storage para que la action pueda borrar el objeto.
-- ----------------------------------------------------------------------------

create or replace function public.admin_imagen_delete(p_imagen_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
begin
  perform public.require_admin('eliminar imagen');

  select im.url into v_url
  from public.producto_imagenes im
  where im.id = p_imagen_id;

  if v_url is null then
    raise exception 'La imagen no existe.';
  end if;

  delete from public.producto_imagenes where id = p_imagen_id;

  return regexp_replace(
    v_url,
    '^https?://[^/]+/storage/v1/object/public/productos/',
    ''
  );
end;
$$;


-- ----------------------------------------------------------------------------
-- 5.3 admin_imagen_reordenar
--     `p_ids` es el orden final deseado. Reescribe `orden_cat` en bloque.
-- ----------------------------------------------------------------------------

create or replace function public.admin_imagen_reordenar(
  p_producto_id uuid,
  p_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pos integer;
begin
  perform public.require_admin('reordenar imágenes');

  if not exists (select 1 from public.productos where id = p_producto_id) then
    raise exception 'El producto no existe.';
  end if;

  -- `p_ids` llega en el orden final deseado. Recorremos los índices del array
  -- (no sus valores) para poder renumerar `orden_cat` de 1 en 1.
  for v_pos in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update public.producto_imagenes
    set orden_cat = v_pos
    where id = p_ids[v_pos] and producto_id = p_producto_id;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5.4 admin_imagen_set_alt
--     Texto alternativo: requisito de accesibilidad, y `alt_text` es NOT NULL en
--     la práctica del catálogo.
-- ----------------------------------------------------------------------------

create or replace function public.admin_imagen_set_alt(
  p_imagen_id uuid,
  p_alt_text text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('editar imagen');

  update public.producto_imagenes
  set alt_text = nullif(btrim(coalesce(p_alt_text, '')), '')
  where id = p_imagen_id;

  if not found then
    raise exception 'La imagen no existe.';
  end if;
end;
$$;


-- ============================================================================
-- 6. Variantes
--
--    `producto_variantes` está vacía pero `carrito_add_item` y `crear_pedido`
--    ya la soportan (`coalesce(var.precio, p.precio)`), así que el panel debe
--    poder gestionarla.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 6.1 admin_variante_upsert
--     `p_id` nulo = alta; informado = edición.
-- ----------------------------------------------------------------------------

create or replace function public.admin_variante_upsert(
  p_producto_id uuid,
  p_titulo text,
  p_precio numeric,
  p_stock integer default 0,
  p_sku text default null,
  p_opciones jsonb default null,
  p_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_opciones jsonb;
begin
  perform public.require_admin('gestionar variantes');

  if not exists (select 1 from public.productos where id = p_producto_id) then
    raise exception 'El producto no existe.';
  end if;

  if p_titulo is null or btrim(p_titulo) = '' then
    raise exception 'El título de la variante es obligatorio.';
  end if;

  if p_precio is null or p_precio < 0 then
    raise exception 'El precio de la variante no puede ser negativo.';
  end if;

  -- `opciones` es jsonb libre: validamos la forma antes de guardarla.
  v_opciones := coalesce(p_opciones, '[]'::jsonb);
  if jsonb_typeof(v_opciones) <> 'array' then
    raise exception 'Las opciones de la variante no tienen el formato correcto.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_opciones) as el
    where jsonb_typeof(el) <> 'object'
       or el ? 'name' is false
       or el ? 'value' is false
  ) then
    raise exception 'Cada opción de la variante necesita los campos «name» y «value».';
  end if;

  if p_id is null then
    insert into public.producto_variantes
      (producto_id, titulo, sku, precio, stock, opciones)
    values (
      p_producto_id, btrim(p_titulo),
      nullif(btrim(coalesce(p_sku, '')), ''),
      p_precio, greatest(coalesce(p_stock, 0), 0), v_opciones
    )
    returning id into v_id;

    return v_id;
  end if;

  if not exists (
    select 1 from public.producto_variantes
    where id = p_id and producto_id = p_producto_id
  ) then
    raise exception 'La variante no pertenece a este producto.';
  end if;

  update public.producto_variantes
  set titulo = btrim(p_titulo),
      sku    = nullif(btrim(coalesce(p_sku, '')), ''),
      precio = p_precio,
      stock  = greatest(coalesce(p_stock, 0), 0),
      opciones = v_opciones
  where id = p_id;

  return p_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 6.2 admin_variante_delete
-- ----------------------------------------------------------------------------

create or replace function public.admin_variante_delete(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('eliminar variante');

  delete from public.producto_variantes where id = p_id;

  if not found then
    raise exception 'La variante no existe.';
  end if;
end;
$$;


-- ============================================================================
-- 7. Categorías
--
--    El árbol es de un solo nivel: es lo que asume `getCategoriasJerarquicas()`.
--    No hay ninguna restricción en la base de datos que lo impida, así que aquí
--    es donde se hace cumplir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 admin_categoria_create
-- ----------------------------------------------------------------------------

create or replace function public.admin_categoria_create(
  p_nombre text,
  p_slug text,
  p_parent_id uuid default null,
  p_descripcion text default null,
  p_image_url text default null,
  p_orden_cat integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_slug text;
  v_orden integer;
begin
  perform public.require_admin('crear categoría');

  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre de la categoría es obligatorio.';
  end if;

  v_slug := lower(btrim(coalesce(p_slug, '')));
  if v_slug = '' then
    raise exception 'El identificador de la categoría es obligatorio.';
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'El identificador solo puede contener letras minúsculas, números y guiones.';
  end if;

  if p_parent_id is not null then
    if not exists (select 1 from public.categorias where id = p_parent_id) then
      raise exception 'La categoría padre no existe.';
    end if;
    if exists (select 1 from public.categorias where id = p_parent_id and parent_id is not null) then
      raise exception 'Solo se admite un nivel de categorías: elige una categoría principal.';
    end if;
  end if;

  -- Unicidad entre hermanos. `is not distinct from` trata los dos null como
  -- iguales, que es justo lo que queremos para las categorías raíz.
  if exists (
    select 1 from public.categorias
    where parent_id is not distinct from p_parent_id and slug = v_slug
  ) then
    raise exception 'Ya existe una categoría con el identificador "%" en ese nivel.', v_slug;
  end if;

  if exists (
    select 1 from public.categorias
    where parent_id is not distinct from p_parent_id
      and lower(btrim(nombre)) = lower(btrim(p_nombre))
  ) then
    raise exception 'Ya existe una categoría con ese nombre en ese nivel.';
  end if;

  v_orden := coalesce(
    p_orden_cat,
    (
      select coalesce(max(c.orden_cat), 0) + 1
      from public.categorias c
      where c.parent_id is not distinct from p_parent_id
    )
  );

  insert into public.categorias (nombre, slug, parent_id, descripcion, image_url, orden_cat)
  values (
    btrim(p_nombre), v_slug, p_parent_id,
    nullif(btrim(coalesce(p_descripcion, '')), ''),
    case
      when p_image_url is null or btrim(p_image_url) = '' then null
      else public.admin_validar_url_imagen(p_image_url)
    end,
    greatest(coalesce(v_orden, 1), 1)
  )
  returning id into v_id;

  return v_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 7.2 admin_categoria_update
--     Repite las comprobaciones del alta en vez de llamar a una función común:
--     aquí el `parent_id` puede cambiar y hay que excluir la propia categoría
--     (`id <> p_id`) de los tests de unicidad, cosa que no hace `admin_categoria_create`.
--     Duplicar unas quince líneas es más barato que una función con seis
--     parámetros opcionales cuyo contrato nadie iba a leer.
-- ----------------------------------------------------------------------------

create or replace function public.admin_categoria_update(
  p_id uuid,
  p_nombre text,
  p_slug text default null,
  p_parent_id uuid default null,
  p_descripcion text default null,
  p_image_url text default null,
  p_orden_cat integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  perform public.require_admin('editar categoría');

  if not exists (select 1 from public.categorias where id = p_id) then
    raise exception 'La categoría no existe.';
  end if;

  if p_nombre is null or btrim(p_nombre) = '' then
    raise exception 'El nombre de la categoría es obligatorio.';
  end if;

  v_slug := nullif(lower(btrim(coalesce(p_slug, ''))), '');
  if v_slug is not null and v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'El identificador solo puede contener letras minúsculas, números y guiones.';
  end if;

  -- Ciclo directo: una categoría no puede ser su propia padre.
  if p_parent_id is not null and p_parent_id = p_id then
    raise exception 'Una categoría no puede ser su propia categoría padre.';
  end if;

  if p_parent_id is not null then
    if not exists (select 1 from public.categorias where id = p_parent_id) then
      raise exception 'La categoría padre no existe.';
    end if;
    -- Ciclo indirecto / más de un nivel.
    if exists (select 1 from public.categorias where id = p_parent_id and parent_id is not null) then
      raise exception 'Solo se admite un nivel de categorías: no puedes anidar una subcategoría.';
    end if;
  end if;

  if v_slug is not null and exists (
    select 1 from public.categorias
    where parent_id is not distinct from p_parent_id
      and slug = v_slug
      and id <> p_id
  ) then
    raise exception 'Ya existe una categoría con el identificador "%" en ese nivel.', v_slug;
  end if;

  if exists (
    select 1 from public.categorias
    where parent_id is not distinct from p_parent_id
      and lower(btrim(nombre)) = lower(btrim(p_nombre))
      and id <> p_id
  ) then
    raise exception 'Ya existe una categoría con ese nombre en ese nivel.';
  end if;

  update public.categorias
  set nombre       = btrim(p_nombre),
      slug         = coalesce(v_slug, slug),
      parent_id    = p_parent_id,
      descripcion  = nullif(btrim(coalesce(p_descripcion, '')), ''),
      image_url    = case
                       when p_image_url is null or btrim(p_image_url) = '' then null
                       else public.admin_validar_url_imagen(p_image_url)
                     end,
      orden_cat    = greatest(coalesce(p_orden_cat, (select c.orden_cat from public.categorias c where c.id = p_id)), 1)
  where id = p_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 7.3 admin_categoria_delete
--     No hace cascada: si hay productos o subcategorías, el panel debe obligar a
--     decidir qué hacer con ellos antes de borrar. Perder productos por un
--     borrado accidental de una categoría sería un desastre.
-- ----------------------------------------------------------------------------

create or replace function public.admin_categoria_delete(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_productos integer;
  v_hijas integer;
begin
  perform public.require_admin('eliminar categoría');

  if not exists (select 1 from public.categorias where id = p_id) then
    raise exception 'La categoría no existe.';
  end if;

  select count(*) into v_productos
  from public.productos where categoria_id = p_id;

  if v_productos > 0 then
    raise exception 'No se puede eliminar: la categoría tiene % producto(s) asignado(s). Reasígnalos primero.', v_productos;
  end if;

  select count(*) into v_hijas
  from public.categorias where parent_id = p_id;

  if v_hijas > 0 then
    raise exception 'No se puede eliminar: la categoría tiene % subcategoría(s). Elimínalas o muévelas primero.', v_hijas;
  end if;

  delete from public.categorias where id = p_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 7.4 admin_categoria_reordenar
--     Intercambia `orden_cat` con la hermana inmediatamente anterior o
--     posterior dentro del mismo nivel. `getNavCategorias()` lee `orden_cat`, así
--     que el cambio se ve en el menú del navbar sin tocar nada más.
-- ----------------------------------------------------------------------------

create or replace function public.admin_categoria_reordenar(
  p_id uuid,
  p_movimiento integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actual public.categorias%rowtype;
  v_otro public.categorias%rowtype;
begin
  perform public.require_admin('reordenar categorías');

  select * into v_actual from public.categorias where id = p_id;
  if not found then
    raise exception 'La categoría no existe.';
  end if;

  if p_movimiento < 0 then
    select * into v_otro
    from public.categorias
    where parent_id is not distinct from v_actual.parent_id
      and orden_cat < v_actual.orden_cat
    order by orden_cat desc
    limit 1;
  else
    select * into v_otro
    from public.categorias
    where parent_id is not distinct from v_actual.parent_id
      and orden_cat > v_actual.orden_cat
    order by orden_cat asc
    limit 1;
  end if;

  -- Ya está en el extremo: no es un error, simplemente no hay nada que hacer.
  if v_otro.id is null then
    return;
  end if;

  update public.categorias
  set orden_cat = case
    when id = v_actual.id then v_otro.orden_cat
    else v_actual.orden_cat
  end
  where id in (v_actual.id, v_otro.id);
end;
$$;


-- ============================================================================
-- 8. Pedidos
--
--    El panel NO gestiona pagos. Los pedidos los crea el webhook de Stripe
--    (`app/api/webhooks/stripe/route.ts`) a través de `crear_pedido`, y `pago_id`
--    es su clave de idempotencia. Reembolsos y capturas se hacen en Stripe
--    Dashboard.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 admin_pedido_update_status
--     Devuelve el estado anterior: la action lo usa para avisar de que cancelar
--     un pedido no repone el stock automáticamente.
-- ----------------------------------------------------------------------------

create or replace function public.admin_pedido_update_status(
  p_pedido_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anterior text;
begin
  perform public.require_admin('cambiar el estado de un pedido');

  select pe.status into v_anterior
  from public.pedidos pe
  where pe.id = p_pedido_id;

  if v_anterior is null then
    raise exception 'El pedido no existe.';
  end if;

  if coalesce(p_status, '') not in ('pending', 'paid', 'shipped', 'delivered', 'cancelled') then
    raise exception 'El estado del pedido no es válido.';
  end if;

  update public.pedidos
  set status = p_status, updated_at = now()
  where id = p_pedido_id;

  return v_anterior;
end;
$$;


-- ----------------------------------------------------------------------------
-- 8.2 admin_pedido_update_tracking
-- ----------------------------------------------------------------------------

create or replace function public.admin_pedido_update_tracking(
  p_pedido_id uuid,
  p_tracking text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('guardar el seguimiento');

  if not exists (select 1 from public.pedidos where id = p_pedido_id) then
    raise exception 'El pedido no existe.';
  end if;

  update public.pedidos
  set tracking_numero = nullif(btrim(coalesce(p_tracking, '')), ''),
      updated_at = now()
  where id = p_pedido_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 8.3 admin_pedido_update_notas
--     Notas internas. Ninguna vista de cliente las expone hoy; no introduzcas
--     ninguna que lo haga.
-- ----------------------------------------------------------------------------

create or replace function public.admin_pedido_update_notas(
  p_pedido_id uuid,
  p_notas text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('guardar notas del pedido');

  if not exists (select 1 from public.pedidos where id = p_pedido_id) then
    raise exception 'El pedido no existe.';
  end if;

  update public.pedidos
  set notas = nullif(btrim(coalesce(p_notas, '')), ''),
      updated_at = now()
  where id = p_pedido_id;
end;
$$;


-- ============================================================================
-- 9. Usuarios
--
--    Las cuentas viven en `auth.users`, fuera del alcance del rol
--    `authenticated`. Estas funciones son la única vía para leerlas sin exponer
--    la `service_role` al cliente, y por eso todas empiezan por `require_admin`.
--
--    Proyección mínima: id, email, fechas y el rol. Nunca tokens, hashes de
--    contraseña ni columnas internas de GoTrue.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1 admin_lista_usuarios
--     `perfiles` se resuelve con LEFT JOIN porque se crea de forma perezosa y
--     puede no existir para una cuenta recién creada.
--
--     El total se cuenta en una consulta aparte de la página: `count(*) over ()`
--     daría el total de la página, no el del conjunto filtrado, que es lo que
--     necesita la paginación.
-- ----------------------------------------------------------------------------

create or replace function public.admin_lista_usuarios(
  p_busqueda text default null,
  p_limite integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_busqueda text := nullif(btrim(coalesce(p_busqueda, '')), '');
  v_total integer := 0;
  v_usuarios jsonb := '[]'::jsonb;
begin
  perform public.require_admin('listar usuarios');

  select count(*)
  into v_total
  from auth.users u
  left join public.perfiles pf on pf.id = u.id
  where (
    v_busqueda is null
    or u.email ilike '%' || v_busqueda || '%'
    or pf.full_nombre ilike '%' || v_busqueda || '%'
  );

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_usuarios
  from (
    select
      u.id,
      u.email,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      (u.raw_app_meta_data ->> 'role') = 'admin' as es_admin,
      (u.banned_until is not null and u.banned_until > now()) as bloqueado,
      pf.full_nombre as nombre,
      pf.telefono    as telefono,
      coalesce(st.n_pedidos, 0)     as pedidos,
      coalesce(st.total_gastado, 0) as total_gastado
    from auth.users u
    left join public.perfiles pf on pf.id = u.id
    left join lateral (
      select
        count(*) as n_pedidos,
        coalesce(sum(
          case when pe.status in ('paid', 'shipped', 'delivered') then pe.total else 0 end
        ), 0) as total_gastado
      from public.pedidos pe
      where pe.usuario_id = u.id
    ) st on true
    where (
      v_busqueda is null
      or u.email ilike '%' || v_busqueda || '%'
      or pf.full_nombre ilike '%' || v_busqueda || '%'
    )
    order by u.created_at desc
    limit greatest(coalesce(p_limite, 50), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) t;

  return jsonb_build_object('total', v_total, 'usuarios', v_usuarios);
end;
$$;


-- ----------------------------------------------------------------------------
-- 9.2 admin_usuario_detalle
-- ----------------------------------------------------------------------------

create or replace function public.admin_usuario_detalle(p_usuario_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('ver un usuario');

  return coalesce(
    (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'email_confirmed_at', u.email_confirmed_at,
        'es_admin', (u.raw_app_meta_data ->> 'role') = 'admin',
        'bloqueado', (u.banned_until is not null and u.banned_until > now()),
        'perfil', (
          select jsonb_build_object(
            'full_nombre', pf.full_nombre,
            'telefono', pf.telefono,
            'direccion_calle', pf.direccion_calle,
            'direccion_ciudad', pf.direccion_ciudad,
            'direccion_provincia', pf.direccion_provincia,
            'direccion_codigo_postal', pf.direccion_codigo_postal,
            'direccion_pais', pf.direccion_pais
          )
          from public.perfiles pf where pf.id = u.id
        ),
        'pedidos', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', pe.id,
              'status', pe.status,
              'total', pe.total,
              'created_at', pe.created_at,
              'articulos', pe.total_lineas
            )
            order by pe.created_at desc
          )
          from (
            select pe2.*,
              (select count(*) from public.items_pedido it where it.pedido_id = pe2.id) as total_lineas
            from public.pedidos pe2
            where pe2.usuario_id = u.id
          ) pe
        ), '[]'::jsonb)
      )
      from auth.users u
      where u.id = p_usuario_id
    ),
    null
  );
end;
$$;


-- ----------------------------------------------------------------------------
-- 9.3 admin_usuario_exportar
--     Derecho de acceso y portabilidad (art. 15 y 20 RGPD). Es lo que promete la
--     política de privacidad, así que tiene que devolver datos de verdad.
-- ----------------------------------------------------------------------------

create or replace function public.admin_usuario_exportar(p_usuario_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('exportar los datos de un usuario');

  return jsonb_build_object(
    'exportado_el', now(),
    'cuenta', (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'creada_el', u.created_at,
        'ultimo_acceso', u.last_sign_in_at,
        'email_confirmado_el', u.email_confirmed_at
      )
      from auth.users u where u.id = p_usuario_id
    ),
    'perfil', (
      select to_jsonb(pf) - 'id'
      from public.perfiles pf where pf.id = p_usuario_id
    ),
    'pedidos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pe.id,
          'status', pe.status,
          'subtotal', pe.subtotal,
          'coste_envio', pe.coste_envio,
          'total', pe.total,
          'moneda', pe.moneda,
          'direccion', pe.direccion_pedido,
          'creado_el', pe.created_at,
          'lineas', (
            select jsonb_agg(
              jsonb_build_object(
                'titulo', it.titulo_producto,
                'cantidad', it.cantidad,
                'precio', it.precio
              ) order by it.id
            )
            from public.items_pedido it where it.pedido_id = pe.id
          )
        ) order by pe.created_at desc
      )
      from public.pedidos pe where pe.usuario_id = p_usuario_id
    ), '[]'::jsonb),
    'lista_de_deseos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'producto_id', w.producto_id,
          'titulo', p.titulo,
          'anadido_el', w.created_at
        ) order by w.created_at desc
      )
      from public.wishlist w
      left join public.productos p on p.id = w.producto_id
      where w.usuario_id = p_usuario_id
    ), '[]'::jsonb)
  );
end;
$$;


-- ----------------------------------------------------------------------------
-- 9.4 admin_usuario_establecer_rol
--
--     Dos decisiones importantes:
--
--     a) Se FUSIONA el rol en `raw_app_meta_data` en lugar de reemplazar el
--        jsonb entero. Reemplazarlo borraría cualquier otro app_metadata que
--        Supabase pueda haber puesto ahí.
--
--     b) `p_usuario_id <> auth.uid()`: nadie puede quitarse a sí mismo el rol.
--        Sin esto, un clic distraído deja el proyecto sin ningún administrador
--        y la única salida es entrar por SQL a mano.
--
--     Tras el cambio hay que refrescar la sesión del usuario afectado para que el
--        JWT se vuelva a firmar con el claim nuevo; el panel no lo fuerza.
-- ----------------------------------------------------------------------------

create or replace function public.admin_usuario_establecer_rol(
  p_usuario_id uuid,
  p_rol text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('cambiar el rol de administrador');

  if p_usuario_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol de administrador.';
  end if;

  if not exists (select 1 from auth.users where id = p_usuario_id) then
    raise exception 'El usuario no existe.';
  end if;

  if p_rol is not null and p_rol <> 'admin' then
    raise exception 'El único rol que se puede asignar es «admin».';
  end if;

  update auth.users
  set raw_app_meta_data = case
    when p_rol is null then coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
    else coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
  end
  where id = p_usuario_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 9.5 admin_usuario_bloquear
--     GoTrue considera una cuenta bloqueada si `banned_until > now()`. No existe
--     un "bloqueo permanente", así que usamos una fecha muy lejana.
-- ----------------------------------------------------------------------------

create or replace function public.admin_usuario_bloquear(
  p_usuario_id uuid,
  p_bloquear boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('bloquear o desbloquear una cuenta');

  if p_usuario_id = auth.uid() then
    raise exception 'No puedes bloquear tu propia cuenta.';
  end if;

  if not exists (select 1 from auth.users where id = p_usuario_id) then
    raise exception 'El usuario no existe.';
  end if;

  update auth.users
  set banned_until = case
    when coalesce(p_bloquear, false) then now() + interval '100 years'
    else null
  end
  where id = p_usuario_id;
end;
$$;


-- ----------------------------------------------------------------------------
-- 9.6 admin_usuario_eliminar
--
--     Derecho de supresión (art. 17 RGPD), con dos matices que hay que entender
--     antes de tocar nada:
--
--     a) NO borramos la fila de `auth.users`. Si `pedidos.usuario_id` estuviera
--        declarado `ON DELETE CASCADE`, borrar la cuenta arrastraría también el
--        histórico de ventas. Perder facturas es peor que conservar un
--        identificador, así que anonimizamos en su lugar: la cuenta queda
--        inservible (email inválido + bloqueada) y sin datos personales.
--
--     b) `pedidos` se conserva íntegro. Hay una obligación legal de conservación
--        de los datos de facturación, y además los pedidos son los snapshots que
--        `items_pedido` ya guardó. La sección «Conservación de los datos» que
--        declara la política de privacidad justifica exactamente esta excepción.
--
--     No tocamos contraseñas ni columnas internas de GoTrue: sus nombres han
--     cambiado entre versiones y una referencia a una columna inexistente
--     revienta la función entera.
-- ----------------------------------------------------------------------------

create or replace function public.admin_usuario_eliminar(p_usuario_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('eliminar los datos de un usuario');

  if p_usuario_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta.';
  end if;

  if not exists (select 1 from auth.users where id = p_usuario_id) then
    raise exception 'El usuario no existe.';
  end if;

  -- Datos personales que no tenemos obligación de conservar.
  delete from public.perfiles      where id = p_usuario_id;
  delete from public.wishlist      where usuario_id = p_usuario_id;
  delete from public.carrito_items where user_id = p_usuario_id;

  -- Anonimización de la cuenta. El email se sustituye por uno del dominio
  -- reservado .invalid (RFC 2606): no puede existir en la realidad, así que
  -- nadie puede acabar notificado de una dirección que ya no le pertenece.
  update auth.users
  set email = 'anon-' || p_usuario_id::text || '@borrado.invalid',
      raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role',
      banned_until = coalesce(banned_until, now() + interval '100 years')
  where id = p_usuario_id;
end;
$$;


-- ============================================================================
-- 10. Métricas del dashboard
--
--     Una sola función devuelve un jsonb con todos los contadores. Motivo
--     práctico: el dashboard haría 9 viajes de red si los pidiera por separado,
--     y `next.config.ts` tiene `useCache: true`, así que además hay que
--     garantizar frescura con una única lectura coherente.
-- ============================================================================

create or replace function public.admin_metricas()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_admin('ver las métricas');

  return jsonb_build_object(
    'productos', jsonb_build_object(
      'total', (select count(*) from public.productos),
      'stock_bajo', (
        select count(*) from public.productos
        where status = 'stock' and stock <= 5
      ),
      'destacados', (select count(*) from public.productos where destacado = true),
      'sin_imagen', (
        select count(*) from public.productos p
        where not exists (
          select 1 from public.producto_imagenes im where im.producto_id = p.id
        )
      ),
      'sin_categoria', (
        select count(*) from public.productos where categoria_id is null
      )
    ),
    'categorias', jsonb_build_object(
      'total', (select count(*) from public.categorias),
      'sin_productos', (
        select count(*) from public.categorias c
        where not exists (
          select 1 from public.productos p where p.categoria_id = c.id
        )
      )
    ),
    'pedidos', jsonb_build_object(
      'total', (select count(*) from public.pedidos),
      'por_estado', (
        select coalesce(
          jsonb_object_agg(pe.status, pe.n),
          '{}'::jsonb
        )
        from (
          select pe2.status, count(*) as n
          from public.pedidos pe2
          group by pe2.status
        ) pe
      ),
      'facturacion_30d', (
        select coalesce(sum(pe.total), 0) from public.pedidos pe
        where pe.status in ('paid', 'shipped', 'delivered')
          and pe.created_at >= now() - interval '30 days'
      ),
      'facturacion_total', (
        select coalesce(sum(pe.total), 0) from public.pedidos pe
        where pe.status in ('paid', 'shipped', 'delivered')
      ),
      'ultimos', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', pe.id,
            'status', pe.status,
            'total', pe.total,
            'created_at', pe.created_at
          ) order by pe.created_at desc
        ), '[]'::jsonb)
        from (
          select pe3.id, pe3.status, pe3.total, pe3.created_at
          from public.pedidos pe3
          order by pe3.created_at desc
          limit 5
        ) pe
      )
    ),
    'usuarios', jsonb_build_object(
      'total', (select count(*) from auth.users)
    )
  );
end;
$$;


-- ============================================================================
-- 11. Permisos
--
--     Cada RPC admin es SECURITY DEFINER, así que un solo `grant` a `anon`
--     convertiría la tabla en escritura pública. A `authenticated` sí, porque
--     `require_admin()` es lo que filtra dentro.
-- ============================================================================

revoke execute on function public.is_admin() from public;
revoke execute on function public.require_admin(text) from public;
revoke execute on function public.admin_validar_url_imagen(text) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.require_admin(text) to authenticated;

revoke execute on function public.admin_producto_create(text, text, text, numeric, uuid, text, integer, boolean, text, text[]) from public, anon;
revoke execute on function public.admin_producto_update(uuid, text, text, text, numeric, uuid, text, integer, boolean, text, text[]) from public, anon;
revoke execute on function public.admin_producto_delete(uuid) from public, anon;
revoke execute on function public.admin_producto_set_destacado(uuid, boolean) from public, anon;
revoke execute on function public.admin_producto_set_stock(uuid, integer) from public, anon;

revoke execute on function public.admin_imagen_add(uuid, text, text) from public, anon;
revoke execute on function public.admin_imagen_delete(uuid) from public, anon;
revoke execute on function public.admin_imagen_reordenar(uuid, uuid[]) from public, anon;
revoke execute on function public.admin_imagen_set_alt(uuid, text) from public, anon;

revoke execute on function public.admin_variante_upsert(uuid, text, numeric, integer, text, jsonb, uuid) from public, anon;
revoke execute on function public.admin_variante_delete(uuid) from public, anon;

revoke execute on function public.admin_categoria_create(text, text, uuid, text, text, integer) from public, anon;
revoke execute on function public.admin_categoria_update(uuid, text, text, uuid, text, text, integer) from public, anon;
revoke execute on function public.admin_categoria_delete(uuid) from public, anon;
revoke execute on function public.admin_categoria_reordenar(uuid, integer) from public, anon;

revoke execute on function public.admin_pedido_update_status(uuid, text) from public, anon;
revoke execute on function public.admin_pedido_update_tracking(uuid, text) from public, anon;
revoke execute on function public.admin_pedido_update_notas(uuid, text) from public, anon;

revoke execute on function public.admin_lista_usuarios(text, integer, integer) from public, anon;
revoke execute on function public.admin_usuario_detalle(uuid) from public, anon;
revoke execute on function public.admin_usuario_exportar(uuid) from public, anon;
revoke execute on function public.admin_usuario_establecer_rol(uuid, text) from public, anon;
revoke execute on function public.admin_usuario_bloquear(uuid, boolean) from public, anon;
revoke execute on function public.admin_usuario_eliminar(uuid) from public, anon;

revoke execute on function public.admin_metricas() from public, anon;

grant execute on function public.admin_producto_create(text, text, text, numeric, uuid, text, integer, boolean, text, text[]) to authenticated;
grant execute on function public.admin_producto_update(uuid, text, text, text, numeric, uuid, text, integer, boolean, text, text[]) to authenticated;
grant execute on function public.admin_producto_delete(uuid) to authenticated;
grant execute on function public.admin_producto_set_destacado(uuid, boolean) to authenticated;
grant execute on function public.admin_producto_set_stock(uuid, integer) to authenticated;

grant execute on function public.admin_imagen_add(uuid, text, text) to authenticated;
grant execute on function public.admin_imagen_delete(uuid) to authenticated;
grant execute on function public.admin_imagen_reordenar(uuid, uuid[]) to authenticated;
grant execute on function public.admin_imagen_set_alt(uuid, text) to authenticated;

grant execute on function public.admin_variante_upsert(uuid, text, numeric, integer, text, jsonb, uuid) to authenticated;
grant execute on function public.admin_variante_delete(uuid) to authenticated;

grant execute on function public.admin_categoria_create(text, text, uuid, text, text, integer) to authenticated;
grant execute on function public.admin_categoria_update(uuid, text, text, uuid, text, text, integer) to authenticated;
grant execute on function public.admin_categoria_delete(uuid) to authenticated;
grant execute on function public.admin_categoria_reordenar(uuid, integer) to authenticated;

grant execute on function public.admin_pedido_update_status(uuid, text) to authenticated;
grant execute on function public.admin_pedido_update_tracking(uuid, text) to authenticated;
grant execute on function public.admin_pedido_update_notas(uuid, text) to authenticated;

grant execute on function public.admin_lista_usuarios(text, integer, integer) to authenticated;
grant execute on function public.admin_usuario_detalle(uuid) to authenticated;
grant execute on function public.admin_usuario_exportar(uuid) to authenticated;
grant execute on function public.admin_usuario_establecer_rol(uuid, text) to authenticated;
grant execute on function public.admin_usuario_bloquear(uuid, boolean) to authenticated;
grant execute on function public.admin_usuario_eliminar(uuid) to authenticated;

grant execute on function public.admin_metricas() to authenticated;


-- ============================================================================
-- 12. Comprobación final
--
--    Ejecuta este SELECT al terminar la migración. Todas las filas deben salir a
--    `f`, menos las dos de `carrito_merge` y `crear_pedido` que sí aceptan
--    `anon` desde la migración anterior (no es un error, es el diseño del
--    webhook de Stripe).
-- ============================================================================

-- select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_puede_ejecutar
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname like 'admin\_%'
-- order by p.proname;
