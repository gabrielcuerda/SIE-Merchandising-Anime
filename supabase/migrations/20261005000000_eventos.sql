-- =============================================================================
--  Migración 20261005000000 — Eventos de negocio
--
--  Tabla de telemetría para el embudo de compra. Solo de lectura para el
--  negocio; nadie escribe en ella desde la aplicación salvo a través de la
--  función `registrar_evento`.
--
--  Qué eventos quedan instrumentados:
--
--    product.viewed      -> components/product/view-tracker.tsx (cliente)
--    cart.item_added     -> gancho en carrito_add_item (sección 4)
--    checkout.started    -> app/api/checkout/route.ts
--    order.created       -> gancho en crear_pedido (sección 9)
--    payment.simulated   -> gancho en crear_pedido (sección 9)
--
--
--  Los ganchos de SQL viven en 20261003000000_carrito_pedidos.sql, junto al
--  resto del código de esas funciones, para no duplicar sus definiciones.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla
--
--    `usuario_id` con ON DELETE SET NULL a propósito: al borrar una cuenta el
--    histórico de eventos sobrevive y no queda colgando de un id que ya no
--    existe. Para un visitante anónimo es NULL y se identifica por
--    `session_id`.
--
--    `metadata` y `created_at` son NOT NULL: una inserción que los omita
--    guardaría NULL y el ORDER BY por fecha empezaría a comportarse de forma
--    impredecible al analizar el embudo.
-- ----------------------------------------------------------------------------

create table if not exists public.eventos (
  id          uuid        primary key default gen_random_uuid(),
  tipo_evento text        not null,
  usuario_id  uuid        references auth.users(id) on delete set null,
  session_id  text,
  metadata    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.eventos is
  'Eventos de negocio del embudo de compra. Solo escribible vía registrar_evento().';

-- Endurecimiento para instalaciones donde la tabla ya existía sin estas
-- restricciones (se crea con la forma final, pero si ya estaba no la cambia).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.eventos'::regclass and contype = 'f'
  ) then
    alter table public.eventos
      add constraint eventos_usuario_id_fkey
      foreign key (usuario_id)
      references auth.users(id) on delete set null;
  end if;
end $$;

update public.eventos set metadata   = '{}'::jsonb where metadata is null;
update public.eventos set created_at = now()       where created_at is null;

alter table public.eventos
  alter column metadata   set default '{}'::jsonb,
  alter column metadata   set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

-- ----------------------------------------------------------------------------
-- 2. Índices
--
--    Sin el primero no se puede sacar el embudo ordenado por tipo y fecha; sin
--    el segundo no se puede reconstruir el recorrido de una visita concreta,
--    que es el uso principal de la tabla.
-- ----------------------------------------------------------------------------

create index if not exists eventos_tipo_fecha_idx
  on public.eventos (tipo_evento, created_at desc);

create index if not exists eventos_sesion_idx
  on public.eventos (session_id);

-- Parcial: la mayoría de eventos son de visitantes sin cuenta.
create index if not exists eventos_usuario_idx
  on public.eventos (usuario_id, created_at desc)
  where usuario_id is not null;

-- ----------------------------------------------------------------------------
-- 3. Cerrar el tramo session_id -> order_id de la trazabilidad
--
--    Los eventos identifican al visitante por `session_id`, pero el pedido se
--    firmaba solo por `usuario_id`. Para un invitado no había forma de unir su
--    recorrido con su pedido. Guardando la sesión en el pedido, la cadena
--    queda cerrada de punta a punta.
-- ----------------------------------------------------------------------------

alter table public.pedidos add column if not exists session_id text;
create index if not exists pedidos_sesion_idx on public.pedidos (session_id);

-- ----------------------------------------------------------------------------
-- 4. RLS y permisos
--
--    A diferencia del resto de tablas del proyecto, aquí NO hay políticas: con
--    RLS activo y cero políticas se deniega todo, y el acceso legítimo entra
--    por la función SECURITY DEFINER de la sección 5. Sin esto la tabla
--    quedaría legible desde PostgREST con el rol `anon`.
-- ----------------------------------------------------------------------------

alter table public.eventos enable row level security;

revoke all on table public.eventos from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. registrar_evento
--
--    SECURITY DEFINER porque el rol que llama (anon o authenticated) no tiene
--    permiso de INSERT sobre la tabla: sin esto, este sería el único punto por
--    el que se puede escribir.
--
--    `usuario_id` sale de auth.uid() y NO es parámetro. Si fuera parámetro,
--    el cliente podría atribuirle sus eventos a cualquier otro usuario, y el
--    histórico de "mis compras" de esa persona quedaría contaminado.
--
--    `session_id` se limpia aquí (trim y cadena vacía -> NULL) para que un
--    espacio en blanco no se cuele como si fuera un identificador de sesión.
-- ----------------------------------------------------------------------------

create or replace function public.registrar_evento(
  p_tipo_evento text,
  p_session_id  text default null,
  p_metadata    jsonb default '{}'::jsonb
) returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.eventos (tipo_evento, session_id, usuario_id, metadata)
  values (
    p_tipo_evento,
    nullif(btrim(coalesce(p_session_id, '')), ''),
    auth.uid(),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id;
$$;

-- ----------------------------------------------------------------------------
-- 6. Permisos de la función
-- ----------------------------------------------------------------------------

revoke execute on function public.registrar_evento(text, text, jsonb) from public;

grant execute on function public.registrar_evento(text, text, jsonb)
  to anon, authenticated;
