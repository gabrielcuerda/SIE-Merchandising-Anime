-- ============================================================================
-- SIE Merchandising Anime — Enlace `pedidos` → `perfiles`
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Ni `perfiles` ni `pedidos` las crea ninguna migración: las dos se crearon a
-- mano en Supabase Studio, junto con el resto del esquema. La única migración
-- del proyecto con `create table` es la de eventos, que crea `eventos`. Por eso
-- el historial no dice nada de este enlace.
--
-- Este script NO depende de 20261004000000_admin_p5.sql: nada de lo que hace
-- aquí toca objetos que esa migración cree. Aun así, conviene aplicar `admin_p5`
-- antes por dos razones prácticas:
--
--   1. Es la que hace que el panel funcione. Si esta se aplicara primero, la FK
--      quedaría puesta pero el seguiría sin cargar nada, y no habría forma de
--      verificar nada.
--   2. El backfill de la sección 2 inserta filas en `perfiles`. Si se ejecuta
--      antes de `admin_p5`, la tabla todavía no tiene RLS y esas filas quedan
--      escritas sin que ninguna política las contemple. Al aplicar `admin_p5`
--      después las políticas no las tocan, así que tampoco rompe: es solo que
--      no conviene dejar el estado intermedio.
--
-- Por qué este script:
--   `lib/admin/pedidos.ts` embebe `perfiles(full_nombre)` en el listado de
--   pedidos del panel. PostgREST resuelve ese embed a través de una clave
--   foránea, y aquí no la había: la consulta fallaba con
--
--     PGRST200  Could not find a relationship between 'pedidos' and 'perfiles'
--
--   Las demás relaciones del panel (`productos` → `categorias`, → `producto_imagenes`,
--   `pedidos` → `items_pedido`, …) sí la tienen. Esta era la única que faltaba.
--
-- Orden interno: defaults → backfill → trigger → FK. Ese orden NO es
-- decorativo. La FK exige que toda cuenta con pedidos tenga fila en `perfiles`,
-- así que primero hay que garantizar que existe; si se creara antes, un
-- `INSERT` en `pedidos` empezaría a fallar con violación de FK y rompería el
-- checkout de todos los usuarios.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Defaults de columnas
--
--    `app/account/actions.ts` hace upsert de perfil pasando únicamente
--    `id`, `full_nombre`, `telefono` y `updated_at`: nunca manda `created_at` ni
--    `direccion_pais`. Si esas columnas son NOT NULL y no tienen default, el
--    guardado del perfil revienta aunque la tabla se llame bien.
--
--    `set default` no puede fallar: si el default ya estaba, no hace nada.
-- ----------------------------------------------------------------------------

alter table public.perfiles alter column direccion_pais set default 'España';
alter table public.perfiles alter column created_at     set default now();
alter table public.perfiles alter column updated_at     set default now();


-- ----------------------------------------------------------------------------
-- 2. Backfill
--
--    `perfiles` estaba vacía: las dos únicas escrituras de perfil de toda la
--    aplicación apuntan a `.from("profiles")`, en inglés, y esa tabla no existe.
--    PostgREST lo confirmaba: `PGRST205 ... Perhaps you meant 'public.perfiles'`.
--    Por eso los pedidos existentes no tienen perfil con el que enlazar.
--
--    Solo se inserta `id`; el resto lo rellenan los defaults del paso 1.
-- ----------------------------------------------------------------------------

insert into public.perfiles (id)
select u.id
from auth.users u
on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- 3. Trigger de alta de cuenta
--
--    `perfiles` se crea de forma perezosa y eso no sirve con una FK: una cuenta
--    recién creada que completa una compra antes de tocar su perfil reventaría el
--    checkout. El trigger garantiza la fila en el mismo momento del alta.
--
--    Es `SECURITY DEFINER` a propósito: el insert lo hace el usuario que dispara
--    el evento de GoTrue, que no es `authenticated` y no tiene permiso de
--    escritura en `perfiles`. Así el RLS de la sección 2 de `admin_p5` no lo
--    molesta.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, direccion_pais)
  values (new.id, 'España')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 4. Clave foránea
--
--    `on delete set null` y no `cascade`: `admin_usuario_eliminar` borra la fila
--    de `perfiles` para anonimizar la cuenta (derecho de supresión, art. 17
--    RGPD) pero conserva `pedidos` íntegro por la obligación legal de conservar
--    datos de facturación. Con `cascade` el borrado de una cuenta se llevaría por
--    delante el histórico de ventas, que es justo lo que esa función promete no
--    hacer.
--
--    Es válido porque `crear_pedido` acepta `p_usuario_id uuid default null`:
--    la columna admite NULL y los pedidos de invitado no la tocan.
--
--    Si el `ALTER` falla con `violates foreign key constraint`, hay un pedido
--    cuyo `usuario_id` no está en `auth.users`. localízalo y decide:
--
--      select pe.id, pe.usuario_id
--      from public.pedidos pe
--      left join auth.users u on u.id = pe.usuario_id
--      where pe.usuario_id is not null and u.id is null;
--
--    y ponle `usuario_id = null`, porque una cuenta que ya no existe no puede
--    volver a iniciar sesión ni comprar.
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.pedidos'::regclass
      and conname  = 'pedidos_usuario_id_perfiles_fkey'
  ) then
    alter table public.pedidos
      add constraint pedidos_usuario_id_perfiles_fkey
      foreign key (usuario_id)
      references public.perfiles (id)
      on delete set null;
  end if;
end;
$$;


-- ----------------------------------------------------------------------------
-- 5. Comprobación
--
--    Debe devolver 1. Si devuelve 0, el embed del panel seguirá fallando y la
--    causa es que `perfiles.id` no es unique: `app/account/actions.ts` hace
--    `upsert(..., { onConflict: "id" })`, que ya exigía esa restricción.
-- ----------------------------------------------------------------------------

-- select count(*) as relacion_ok
-- from pg_constraint
-- where conrelid = 'public.pedidos'::regclass
--   and conname  = 'pedidos_usuario_id_perfiles_fkey';