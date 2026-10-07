-- ============================================================================
-- SIE Merchandising Anime — Registro de correos enviados
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Por qué existe esta tabla y no solo un `console.log` en el webhook:
--
--   `crear_pedido` se llama desde DOS sitios —el webhook de Stripe y la página
--   /order-confirmation, que actúa de red de seguridad— y ambos terminan
--   intentando mandar la factura. `crear_pedido` es idempotente por `pago_id`
--   porque el duplicado sería un pedido duplicado, pero un correo duplicado es
--   justo lo que el cliente percibe como "me han cobrado dos veces".
--
--   Aquí el que resuelve el duplicado es el índice `unique (pedido_id,
--   plantilla)`. `correo_reservar` hace un INSERT que, si choca, solo actualiza
--   la fila cuando NO se envió con éxito o cuando se fuerza el reenvío. Eso da
--   las tres reglas que hacen falta, sin coordinación entre procesos:
--
--     1. El webhook y /order-confirmation pueden pedirla a la vez → solo uno
--        obtiene `true` (el INSERT atómico decide un único ganador).
--     2. Ya enviada con éxito → nunca se vuelve a mandar sola.
--     3. Un envío fallido SÍ se reintenta: `estado <> 'enviado'` deja pasar la
--        fila. Un fallo de SMTP no debe cerrar la puerta a la factura.
--
-- La tabla no está bloqueada a propósito. Es el sitio donde se mira si un
-- cliente dice "no me ha llegado la factura", y ese estado tiene que existir
-- aunque el envío haya fallado.
-- ============================================================================

create table if not exists public.correos_enviados (
  id          uuid        primary key default gen_random_uuid(),
  pedido_id   uuid        not null references public.pedidos (id) on delete cascade,
  -- 'factura' por ahora. La columna está para que añadir otro tipo de correo
  -- (aviso de envío, cualquier otra cosa) no exija otra tabla.
  plantilla   text        not null,
  destinatario text       not null,
  estado      text        not null default 'pendiente',
  -- Cada vez que se reserva: una más. Sirve para distinguir "se intentó una vez
  -- y falló" de "se reenvió cuatro veces a mano porque el cliente dice que no
  -- le llega".
  intentos    integer     not null default 0,
  -- messageId de SMTP. Es el id con el que se rastrea el correo en el log del
  -- servidor de DonDominio.
  mensaje_id  text,
  error       text,
  enviado_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint correos_enviados_estado_check
    check (estado in ('pendiente', 'enviado', 'error')),
  constraint correos_enviados_plantilla_check
    check (plantilla in ('factura')),
  -- LA pieza anti-duplicado.
  constraint correos_enviados_pedido_plantilla_key unique (pedido_id, plantilla)
);

create index if not exists correos_enviados_pedido_idx
  on public.correos_enviados (pedido_id);

-- ----------------------------------------------------------------------------
-- 1. RLS y permisos
--
--    Igual que `eventos`: RLS activado y CERO políticas, lo que en Supabase
--    significa denegar todo. No hay ninguna lectura legítima directa: el panel
--    y el webhook entran por las funciones de más abajo.
-- ----------------------------------------------------------------------------

alter table public.correos_enviados enable row level security;

revoke all on table public.correos_enviados from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. correo_pedido — el pedido completo a partir del pago
--
--    Existe por un motivo concreto: `pedido_por_pago` filtra con
--    `pe.usuario_id is null or pe.usuario_id = auth.uid()`, y el webhook de
--    Stripe no tiene cookies, o sea que `auth.uid()` es NULL. Con esta función
--    el webhook sí puede montar la factura de un pedido hecho con cuenta
--    iniciada, que es justamente la mitad de los casos que nos piden.
--
--    Consecuencia asumida: quien conozca el `cs_...` de una sesión de Stripe
--    puede leer el pedido sea de invitado o con cuenta. Ese `cs_...` es un
--    secreto de alta entropía que solo tiene quien pagó, que además acaba de
--    recibir por email la misma factura con la misma dirección de envío de
--    Stripe. No amplía lo que el cliente ya puede ver de su propia compra, y a
--    cambio permite que el sistema facture a un cliente registrado sin pedirle
--    que inicie sesión otra vez.
--
--    Los pedidos NULL no son un problema: `pedido_id` es NOT NULL y el pago es
--    obligatorio en `crear_pedido`.
-- ----------------------------------------------------------------------------

create or replace function public.correo_pedido(p_pago_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select jsonb_build_object(
      'id', pe.id,
      'usuario_id', pe.usuario_id,
      'status', pe.status,
      'subtotal', pe.subtotal,
      'coste_envio', pe.coste_envio,
      'total', pe.total,
      'moneda', pe.moneda,
      'direccion_pedido', pe.direccion_pedido,
      'direccion_pago', pe.direccion_pago,
      'metodo_pago', pe.metodo_pago,
      'pago_id', pe.pago_id,
      'created_at', pe.created_at,
      'items_pedido', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', it.id,
              'producto_id', it.producto_id,
              'variante_id', it.variante_id,
              'titulo_producto', it.titulo_producto,
              'img_producto', it.img_producto,
              'cantidad', it.cantidad,
              'precio', it.precio
            )
            order by it.id
          )
          from public.items_pedido it
          where it.pedido_id = pe.id
        ),
        '[]'::jsonb
      )
    )
    from public.pedidos pe
    where pe.pago_id = p_pago_id
    limit 1
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. correo_reservar — el guardián de un envío por pedido
--
--    Devuelve TRUE si el que llama se queda con el derecho a enviar esa
--    plantilla de este pedido, y FALSE si ya está enviada (o si otro proceso se
--    ha adelantado). Un FALSE aquí NO es un error: es la respuesta normal cuando
--    el webhook y /order-confirmation chocan.
--
--    `p_forzar` lo usa el reenvío manual del panel y es lo único que permite
--    mandar dos veces una factura que ya salió.
--
--    La segunda rama del ON CONFLICT (el UPDATE ... WHERE) es lo que hace que
--    el UNIQUE sirva de algo: sin ella, el conflicto abortaría la sentencia
--    entera en lugar de devolver "ya lo tienes".
-- ----------------------------------------------------------------------------

create or replace function public.correo_reservar(
  p_pedido_id    uuid,
  p_plantilla    text default 'factura',
  p_destinatario text default '',
  p_forzar       boolean default false
) returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.correos_enviados (
    pedido_id, plantilla, destinatario, estado, intentos
  ) values (
    p_pedido_id, p_plantilla, p_destinatario, 'pendiente', 1
  )
  on conflict (pedido_id, plantilla) do update
    set destinatario  = excluded.destinatario,
        estado        = 'pendiente',
        intentos      = public.correos_enviados.intentos + 1,
        error         = null,
        mensaje_id    = null,
        enviado_at    = null
    where public.correos_enviados.estado <> 'enviado'
       or p_forzar
  returning id into v_id;

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. correo_registrar_envio / correo_registrar_error
--
--    El cierre del envío. Sin esto, una fila que se reservó y a la que el SMTP
--    tiró después se quedaría en 'pendiente' para siempre y el siguiente
--    intento ya no podría reenviarla.
-- ----------------------------------------------------------------------------

create or replace function public.correo_registrar_envio(
  p_id         uuid,
  p_mensaje_id text default null
) returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.correos_enviados
     set estado = 'enviado',
         mensaje_id = nullif(btrim(coalesce(p_mensaje_id, '')), ''),
         error = null,
         enviado_at = now()
   where id = p_id;
$$;

create or replace function public.correo_registrar_error(
  p_id    uuid,
  p_error text
) returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.correos_enviados
     set estado = 'error',
         error = left(coalesce(p_error, ''), 500),
         enviado_at = null
   where id = p_id;
$$;

-- ----------------------------------------------------------------------------
-- 5. correo_estado — qué se mandó de un pedido
--
--    Lo lee el panel para enseñar "Factura enviada el ..." o el error, y para
--    no ofrecer un reenvío a un pedido que no tiene email.
-- ----------------------------------------------------------------------------

create or replace function public.correo_estado(p_pedido_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select jsonb_build_object(
      'estado', ce.estado,
      'destinatario', ce.destinatario,
      'intentos', ce.intentos,
      'enviado_at', ce.enviado_at,
      'error', ce.error
    )
    from public.correos_enviados ce
    where ce.pedido_id = p_pedido_id
    order by ce.created_at desc
    limit 1
  );
$$;

-- ----------------------------------------------------------------------------
-- 6. Permisos
--
--    `correo_reservar`, `correo_registrar_*` y `correo_pedido` van a `anon`
--    porque quien los llama es el webhook de Stripe, que llega sin cookies y
--    por tanto sin usuario: sin el rol `anon` no podría ni reservar el envío ni
--    leer el pedido que acaba de crear.
--
--    El que PUEDE causar daño es `correo_pedido` (lee datos de pedidos de
--    cualquiera que conozca el `cs_...`) y `correo_reservar` (puede gastar
--    intentos). Se aceptan porque el primero necesita un secreto que solo tiene
--    quien pagó, y el segundo no envía nada por sí mismo: quien manda el correo
--    es el servidor, no el cliente.
-- ----------------------------------------------------------------------------

revoke execute on function public.correo_pedido(text) from public;
revoke execute on function public.correo_reservar(uuid, text, text, boolean) from public;
revoke execute on function public.correo_registrar_envio(uuid, text) from public;
revoke execute on function public.correo_registrar_error(uuid, text) from public;
revoke execute on function public.correo_estado(uuid) from public;

grant execute on function public.correo_pedido(text) to anon, authenticated;
grant execute on function public.correo_reservar(uuid, text, text, boolean) to anon, authenticated;
grant execute on function public.correo_registrar_envio(uuid, text) to anon, authenticated;
grant execute on function public.correo_registrar_error(uuid, text) to anon, authenticated;
grant execute on function public.correo_estado(uuid) to authenticated;