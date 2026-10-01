-- =============================================================================
-- 002_storage.sql — Bucket público `productos` para las imágenes que sube el
-- panel admin desde /admin/productos.
--
-- CÓMO APLICAR: después de 001_admin_rls.sql, en Supabase → SQL Editor.
-- ES IDEMPOTENTE.
--
-- CONTEXTO: `next.config.ts` ya permite optimizar con next/image las imágenes
-- servidas desde `**.supabase.co/storage/v1/object/public/**`, así que no hace
-- falta tocar la configuración de Next.js.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bucket público `productos`
--    `public = true` porque el storefront necesita leer las imágenes con la
--    clave anon. La ESCRITURA no se expone a ningún rol de navegador: el
--    uploader del panel admin usa la service role key.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'productos',
  'productos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 2. Policies de Storage
--    `storage.objects` hereda RLS de su propia tabla: hay que activarlo.
-- -----------------------------------------------------------------------------

alter table storage.objects enable row level security;

-- Cualquiera puede LEER los objetos del bucket (público).
drop policy if exists "productos lectura publica" on storage.objects;
create policy "productos lectura publica" on storage.objects
  for select
  using (bucket_id = 'productos');

-- Nadie escribe desde el navegador. Se deja explícito para que quede claro
-- que la subida sólo ocurre desde el servidor con la service role key.
drop policy if exists "productos escritura solo service role" on storage.objects;
create policy "productos escritura solo service role" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and false);

-- -----------------------------------------------------------------------------
-- 3. Comprobación
-- -----------------------------------------------------------------------------
--   select id, name, public from storage.buckets where id = 'productos';
