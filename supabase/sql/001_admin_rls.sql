-- =============================================================================
-- 001_admin_rls.sql — Row Level Security para el catálogo, las cuentas y el
-- panel admin de SIE Merchandising Anime.
--
-- CÓMO APLICAR: Supabase → SQL Editor → pega → Run.
-- ES IDEMPOTENTE: se puede volver a ejecutar sin efectos adverse.
--
-- POR QUÉ: hasta ahora la app usaba la clave `publishable` (el rol `anon`)
-- para TODO. Con RLS desactivado, cualquiera podía leer desde el navegador la
-- tabla `pedidos` completa (nombre, email, direcciones, importes). Eso es una
-- fuga de datos personales y contradice la política de privacidad publicada
-- en /privacidad.
--
-- REGLA DE ORO: el catálogo es público de lectura, los datos de personas son
-- privados, y NINGÚN rol de navegador escribe. El panel admin opera con la
-- service role key, que ignora estas políticas por completo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Catálogo: lectura pública para todos (lo necesitan home, búsqueda, sitemap)
-- -----------------------------------------------------------------------------

alter table public.categorias          enable row level security;
alter table public.productos          enable row level security;
alter table public.producto_imagenes  enable row level security;
alter table public.producto_variantes enable row level security;

drop policy if exists "catalogo categorias select" on public.categorias;
create policy "catalogo categorias select" on public.categorias
  for select using (true);

drop policy if exists "catalogo productos select" on public.productos;
create policy "catalogo productos select" on public.productos
  for select using (true);

drop policy if exists "catalogo producto_imagenes select" on public.producto_imagenes;
create policy "catalogo producto_imagenes select" on public.producto_imagenes
  for select using (true);

drop policy if exists "catalogo producto_variantes select" on public.producto_variantes;
create policy "catalogo producto_variantes select" on public.producto_variantes
  for select using (true);

-- El catálogo NO expone insert/update/delete a ningún rol de navegador:
-- el alta, edición y borrado sólo existen en el panel admin (service role).

-- -----------------------------------------------------------------------------
-- 2. Datos personales: cada usuario sólo ve y toca lo suyo
--    `usuario_id` en pedidos/items_pedido/wishlist, `user_id` en carrito_items.
--    OJO: `items_pedido` cuelga de `pedidos.usuario_id`.
-- -----------------------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.pedidos     enable row level security;
alter table public.items_pedido enable row level security;
alter table public.wishlist    enable row level security;
alter table public.carrito_items enable row level security;

-- Perfil propio: lectura y escritura.
drop policy if exists "perfil propio select" on public.profiles;
create policy "perfil propio select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "perfil propio update" on public.profiles;
create policy "perfil propio update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "perfil propio insert" on public.profiles;
create policy "perfil propio insert" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

-- Pedidos: sólo lectura de los propios (crear y cambiar estado lo hace el
-- webhook de Stripe con service role).
drop policy if exists "pedidos propios select" on public.pedidos;
create policy "pedidos propios select" on public.pedidos
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

-- Líneas de pedido: lectura heredando la propiedad del pedido.
drop policy if exists "items de pedido propios select" on public.items_pedido;
create policy "items de pedido propios select" on public.items_pedido
  for select to authenticated
  using (
    exists (
      select 1 from public.pedidos p
      where p.id = items_pedido.pedido_id
        and p.usuario_id = (select auth.uid())
    )
  );

-- Lista de deseos.
drop policy if exists "wishlist propia select" on public.wishlist;
create policy "wishlist propia select" on public.wishlist
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

drop policy if exists "wishlist propia insert" on public.wishlist;
create policy "wishlist propia insert" on public.wishlist
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

drop policy if exists "wishlist propia delete" on public.wishlist;
create policy "wishlist propia delete" on public.wishlist
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- Carrito: por usuario o por sesión anónima (`cart_session_id`).
drop policy if exists "carrito propio o de sesion select" on public.carrito_items;
create policy "carrito propio o de sesion select" on public.carrito_items
  for select to authenticated
  using ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "carrito propio o de sesion insert" on public.carrito_items;
create policy "carrito propio o de sesion insert" on public.carrito_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "carrito propio o de sesion update" on public.carrito_items;
create policy "carrito propio o de sesion update" on public.carrito_items
  for update to authenticated
  using ((select auth.uid()) = user_id or user_id is null)
  with check ((select auth.uid()) = user_id or user_id is null);

drop policy if exists "carrito propio o de sesion delete" on public.carrito_items;
create policy "carrito propio o de sesion delete" on public.carrito_items
  for delete to authenticated
  using ((select auth.uid()) = user_id or user_id is null);

-- -----------------------------------------------------------------------------
-- 3. Índices que sostienen las consultas del panel admin (/admin).
--    El dashboard agrega ventas por mes y por producto sobre `pedidos` e
--    `items_pedido`; sin estos índices hace seq scan sobre toda la tabla.
-- -----------------------------------------------------------------------------

create index if not exists pedidos_created_at_idx      on public.pedidos (created_at desc);
create index if not exists pedidos_status_idx          on public.pedidos (status);
create index if not exists pedidos_usuario_id_idx      on public.pedidos (usuario_id);
create index if not exists items_pedido_pedido_id_idx  on public.items_pedido (pedido_id);
create index if not exists items_pedido_producto_id_idx on public.items_pedido (producto_id);
create index if exists productos_categoria_id_idx      on public.productos (categoria_id);
create index if exists productos_status_idx           on public.productos (status);
create index if exists productos_created_at_idx       on public.productos (created_at desc);
create index if exists categorias_parent_id_idx       on public.categorias (parent_id);

-- -----------------------------------------------------------------------------
-- 4. Verificación (ejecuta esto después de aplicar el script)
-- -----------------------------------------------------------------------------
-- Las consultas de abajo deben devolver 0 filas si eres un usuario normal,
-- y datos reales sólo si ejecutas la sesión como postgres/service_role.
--
--   select count(*) from public.pedidos;
--   select count(*) from public.profiles;
