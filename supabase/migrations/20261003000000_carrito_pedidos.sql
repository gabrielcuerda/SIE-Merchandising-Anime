-- ============================================================================
-- SIE Merchandising Anime — Carrito y pedidos sobre Supabase
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Por qué funciones y no políticas RLS:
--   el carrito de un usuario anónimo se identifica con un `session_id` (uuid
--   aleatorio) que viaja en una cookie. La base de datos no puede validar ese
--   valor, así que RLS no sirve. Lo resolvemos con funciones SECURITY DEFINER
--   que aplican internamente la regla de propiedad ("usuario si hay sesión,
--   session_id si no") y dejan el RLS activado sin políticas: por defecto se
--   deniega todo el acceso directo a la tabla.
-- ============================================================================

alter table public.carrito_items enable row level security;
alter table public.pedidos enable row level security;
alter table public.items_pedido enable row level security;

-- ----------------------------------------------------------------------------
-- 1. Una sola fila por (propietario, producto, variante)
--    Necesario para poder consolidar cantidades al añadir y al hacer login.
-- ----------------------------------------------------------------------------

delete from public.carrito_items a
using public.carrito_items b
where a.id > b.id
  and coalesce(a.user_id::text, a.session_id)
      is not distinct from coalesce(b.user_id::text, b.session_id)
  and a.producto_id is not distinct from b.producto_id
  and a.variante_id is not distinct from b.variante_id;

create unique index if not exists carrito_items_propietario_idx
  on public.carrito_items (
    coalesce(user_id::text, session_id),
    coalesce(producto_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(variante_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ----------------------------------------------------------------------------
-- 2. Lectura del carrito
--
--    Devuelve jsonb con el producto, su slug, sus imágenes y el precio unitario
--    ya resuelto. `producto_variantes` llega siempre relleno: si el producto no
--    tiene fila en producto_variantes (es lo normal ahora mismo) se synthesiza
--    con el precio del propio producto, para que el carrito nunca sume 0 €.
--
--    `variante_id` se guarda como NULL cuando la variante no existe de verdad:
--    la columna tiene FK contra producto_variantes y mapProduct genera una
--    variante sintética cuyo id es el del producto, que siempre violaría la FK.
-- ----------------------------------------------------------------------------

create or replace function public.carrito_get_items(p_session_id text default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', ci.id,
          'user_id', ci.user_id,
          'session_id', ci.session_id,
          'producto_id', ci.producto_id,
          'variante_id', ci.variante_id,
          'cantidad', ci.cantidad,
          'created_at', ci.created_at,
          'productos', jsonb_build_object(
            'id', p.id,
            'titulo', p.titulo,
            'slug', p.slug,
            'producto_imagenes', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object('url', pi.url, 'alt_text', pi.alt_text)
                  order by pi.orden_cat, pi.id
                )
                from public.producto_imagenes pi
                where pi.producto_id = p.id
              ),
              '[]'::jsonb
            )
          ),
          'producto_variantes', jsonb_build_object(
            'id', var.id,
            'titulo', coalesce(var.titulo, 'Default Title'),
            'precio', coalesce(var.precio, p.precio)
          )
        )
        order by ci.created_at, ci.id
      )
      from public.carrito_items ci
      join public.productos p on p.id = ci.producto_id
      left join public.producto_variantes var on var.id = ci.variante_id
      where
        (auth.uid() is not null and ci.user_id = auth.uid())
        or (auth.uid() is null and p_session_id is not null
            and ci.session_id = p_session_id)
    ),
    '[]'::jsonb
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. Añadir al carrito
--
--    Si el producto ya está en el carrito suma la cantidad, si no inserta.
--    Valida stock solo para productos con status = 'stock'; en pre-venta,
--    a-pedido y oferta el stock no limita la venta.
-- ----------------------------------------------------------------------------

create or replace function public.carrito_add_item(
  p_producto_id uuid,
  p_variante_id uuid default null,
  p_cantidad integer default 1,
  p_session_id text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sid text := case when v_uid is not null then null
                     else nullif(btrim(coalesce(p_session_id, '')), '') end;
  v_cantidad integer := greatest(1, least(99, coalesce(p_cantidad, 1)));
  v_variante uuid;
  v_stock_producto integer;
  v_stock_variante integer;
  v_status text;
  v_item_id uuid;
  v_actual integer;
begin
  if v_uid is null and v_sid is null then
    raise exception 'No se ha podido identificar el carrito.';
  end if;

  select p.stock, p.status
    into v_stock_producto, v_status
  from public.productos p
  where p.id = p_producto_id;

  if not found then
    raise exception 'El producto no existe.';
  end if;

  -- La variante solo cuenta si existe de verdad en producto_variantes.
  if p_variante_id is not null then
    select var.id into v_variante
    from public.producto_variantes var
    where var.id = p_variante_id and var.producto_id = p_producto_id;
  end if;

  if v_status = 'stock' and coalesce(v_stock_producto, 0) <= 0 then
    raise exception 'El producto está agotado.';
  end if;

  if v_variante is not null then
    select var.stock into v_stock_variante
    from public.producto_variantes var
    where var.id = v_variante;
  end if;

  select ci.id, ci.cantidad into v_item_id, v_actual
  from public.carrito_items ci
  where ci.producto_id = p_producto_id
    and ci.variante_id is not distinct from v_variante
    and ((v_uid is not null and ci.user_id = v_uid)
         or (v_uid is null and ci.session_id = v_sid))
  limit 1;

  if found then
    if v_status = 'stock'
       and v_stock_producto - coalesce(v_actual, 0) < v_cantidad then
      raise exception 'Solo quedan % unidades disponibles.',
        greatest(v_stock_producto - coalesce(v_actual, 0), 0);
    end if;
    if v_status = 'stock' and coalesce(v_stock_variante, 0) > 0
       and v_stock_variante - coalesce(v_actual, 0) < v_cantidad then
      raise exception 'Solo quedan % unidades de esta variante.',
        greatest(v_stock_variante - coalesce(v_actual, 0), 0);
    end if;

    update public.carrito_items
      set cantidad = least(99, coalesce(v_actual, 0) + v_cantidad)
    where id = v_item_id;

    -- Evento de negocio. Va dentro de la función, y por tanto dentro de la
    -- misma transacción que el cambio de estado: si el carrito se actualiza,
    -- el evento existe. Ver 20261005000000_eventos.sql.
    --
    -- `accion` distingue una línea nueva de una cantidad sumada a la que ya
    -- estaba, que en el embudo son dos hechos distintos.
    perform public.registrar_evento(
      'cart.item_added', v_sid,
      jsonb_build_object(
        'producto_id', p_producto_id,
        'variante_id', v_variante,
        'cantidad',    v_cantidad,
        'accion',      'consolidada'
      )
    );

    return v_item_id;
  end if;

  if v_status = 'stock' and v_stock_producto < v_cantidad then
    raise exception 'Solo quedan % unidades disponibles.',
      greatest(v_stock_producto, 0);
  end if;

  insert into public.carrito_items (
    user_id, session_id, producto_id, variante_id, cantidad
  ) values (
    v_uid, v_sid, p_producto_id, v_variante, v_cantidad
  )
  returning id into v_item_id;

  perform public.registrar_evento(
    'cart.item_added', v_sid,
    jsonb_build_object(
      'producto_id', p_producto_id,
      'variante_id', v_variante,
      'cantidad',    v_cantidad,
      'accion',      'nueva_linea'
    )
  );

  return v_item_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Modificar cantidad (cantidad <= 0 borra la línea)
-- ----------------------------------------------------------------------------

create or replace function public.carrito_set_cantidad(
  p_item_id uuid,
  p_cantidad integer,
  p_session_id text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sid text := case when v_uid is not null then null
                     else nullif(btrim(coalesce(p_session_id, '')), '') end;
begin
  if v_uid is null and v_sid is null then
    raise exception 'No se ha podido identificar el carrito.';
  end if;

  if coalesce(p_cantidad, 0) <= 0 then
    perform public.carrito_remove_item(p_item_id, v_sid);
    return;
  end if;

  update public.carrito_items ci
  set cantidad = least(99, p_cantidad)
  where ci.id = p_item_id
    and ((v_uid is not null and ci.user_id = v_uid)
         or (v_uid is null and ci.session_id = v_sid));

  if not found then
    raise exception 'Ese artículo no está en tu carrito.';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Borrar una línea
-- ----------------------------------------------------------------------------

create or replace function public.carrito_remove_item(
  p_item_id uuid,
  p_session_id text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sid text := case when v_uid is not null then null
                     else nullif(btrim(coalesce(p_session_id, '')), '') end;
begin
  if v_uid is null and v_sid is null then
    raise exception 'No se ha podido identificar el carrito.';
  end if;

  delete from public.carrito_items ci
  where ci.id = p_item_id
    and ((v_uid is not null and ci.user_id = v_uid)
         or (v_uid is null and ci.session_id = v_sid));

  if not found then
    raise exception 'Ese artículo no está en tu carrito.';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. Vaciar el carrito
-- ----------------------------------------------------------------------------

create or replace function public.carrito_clear(p_session_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sid text := case when v_uid is not null then null
                     else nullif(btrim(coalesce(p_session_id, '')), '') end;
begin
  if v_uid is null and v_sid is null then
    raise exception 'No se ha podido identificar el carrito.';
  end if;

  if v_uid is not null then
    delete from public.carrito_items where user_id = v_uid;
  else
    delete from public.carrito_items where session_id = v_sid;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. Al iniciar sesión: el carrito anónimo pasa al usuario
--    Si ya tenía esa misma línea, suma cantidades en lugar de duplicar.
-- ----------------------------------------------------------------------------

create or replace function public.carrito_merge(p_session_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sid text := nullif(btrim(coalesce(p_session_id, '')), '');
  v_anon record;
  v_destino uuid;
begin
  if v_uid is null or v_sid is null then
    return;
  end if;

  for v_anon in
    select * from public.carrito_items
    where session_id = v_sid and user_id is null
    order by created_at, id
  loop
    select ci.id into v_destino
    from public.carrito_items ci
    where ci.user_id = v_uid
      and ci.producto_id = v_anon.producto_id
      and ci.variante_id is not distinct from v_anon.variante_id
    limit 1;

    if found then
      update public.carrito_items
      set cantidad = least(99, cantidad + v_anon.cantidad)
      where id = v_destino;

      delete from public.carrito_items where id = v_anon.id;
    else
      update public.carrito_items
      set user_id = v_uid, session_id = null
      where id = v_anon.id;
    end if;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 9. Crear el pedido a partir del carrito
--
--    Todo en una transacción: pedido + líneas + descuento de stock + vaciado
--    del carrito. Si algo falla no queda nada a medias.
--
--    Idempotente por `p_pago_id`: el webhook de Stripe y la página de
--    confirmación pueden recibir el mismo pago y solo se crea un pedido.
--
--    `p_usuario_id` se ignora si la llamada viene de un usuario autenticado
--    (mandaría el suyo). El caso "usuario explícito sin sesión" es el del
--    webhook, que no recibe cookies.
--
--    IVA: los precios de `productos.precio` son SIN IVA, así que el total se
--    calcula con el 21 %. Como `pedidos` no tiene columna de impuestos, el
--    desglose se guarda en `direccion_pago`.
-- ----------------------------------------------------------------------------

create or replace function public.crear_pedido(
  p_usuario_id uuid default null,
  p_session_id text default null,
  p_direccion jsonb,
  p_pago_id text,
  p_metodo_pago text default 'stripe',
  p_iva_porcentaje numeric default 21,
  p_coste_envio numeric default 0
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_propietario uuid;
  v_sesion text;
  v_item record;
  v_pedido_id uuid;
  v_existente uuid;
  v_subtotal numeric := 0;
  v_iva numeric := 0;
  v_total numeric := 0;
  v_precio numeric;
begin
  if nullif(btrim(coalesce(p_pago_id, '')), '') is null then
    raise exception 'Falta el identificador del pago.';
  end if;

  if p_direccion is null or p_direccion = '{}'::jsonb then
    raise exception 'Falta la dirección de envío.';
  end if;

  -- Idempotencia: si el pago ya está registrado devolvemos ese pedido.
  select pe.id into v_existente
  from public.pedidos pe
  where pe.pago_id = p_pago_id
  limit 1;

  if found then
    return v_existente;
  end if;

  v_propietario := coalesce(v_uid, p_usuario_id);
  v_sesion := case
    when v_propietario is not null then null
    else nullif(btrim(coalesce(p_session_id, '')), '')
  end;

  if v_propietario is null and v_sesion is null then
    raise exception 'No se ha podido identificar el carrito del que crear el pedido.';
  end if;

  perform 1
  from public.carrito_items ci
  where (v_propietario is not null and ci.user_id = v_propietario)
     or (v_propietario is null and ci.session_id = v_sesion)
  limit 1;

  if not found then
    raise exception 'El carrito está vacío.';
  end if;

  select coalesce(sum(coalesce(var.precio, p.precio) * ci.cantidad), 0)
    into v_subtotal
  from public.carrito_items ci
  join public.productos p on p.id = ci.producto_id
  left join public.producto_variantes var on var.id = ci.variante_id
  where (v_propietario is not null and ci.user_id = v_propietario)
     or (v_propietario is null and ci.session_id = v_sesion);

  v_iva := round(v_subtotal * p_iva_porcentaje / 100, 2);
  v_total := v_subtotal + v_iva + coalesce(p_coste_envio, 0);

  insert into public.pedidos (
    usuario_id, session_id, status, subtotal, coste_envio, total, moneda,
    direccion_pedido, direccion_pago, metodo_pago, pago_id
  ) values (
    v_propietario,
    -- Para un invitado, la única forma de unir su recorrido de eventos con su
    -- pedido. Sin esta columna el tramo session_id -> order_id se rompía.
    v_sesion,
    'paid',
    v_subtotal,
    coalesce(p_coste_envio, 0),
    v_total,
    'EUR',
    p_direccion,
    jsonb_build_object(
      'subtotal', v_subtotal,
      'iva_porcentaje', p_iva_porcentaje,
      'iva', v_iva,
      'coste_envio', coalesce(p_coste_envio, 0),
      'total', v_total
    ),
    p_metodo_pago,
    p_pago_id
  )
  returning id into v_pedido_id;

  for v_item in
    select
      ci.producto_id,
      ci.variante_id,
      ci.cantidad,
      p.titulo,
      coalesce(var.precio, p.precio) as precio,
      (
        select pi.url
        from public.producto_imagenes pi
        where pi.producto_id = p.id
        order by pi.orden_cat, pi.id
        limit 1
      ) as imagen
    from public.carrito_items ci
    join public.productos p on p.id = ci.producto_id
    left join public.producto_variantes var on var.id = ci.variante_id
    where (v_propietario is not null and ci.user_id = v_propietario)
       or (v_propietario is null and ci.session_id = v_sesion)
    order by ci.created_at, ci.id
  loop
    v_precio := v_item.precio;

    insert into public.items_pedido (
      pedido_id, producto_id, variante_id, titulo_producto,
      img_producto, cantidad, precio
    ) values (
      v_pedido_id, v_item.producto_id, v_item.variante_id, v_item.titulo,
      v_item.imagen, v_item.cantidad, v_precio
    );

    -- El stock solo se descuenta en productos gestionados por stock.
    update public.productos
    set stock = greatest(0, stock - v_item.cantidad),
        updated_at = now()
    where id = v_item.producto_id
      and status = 'stock';
  end loop;

  -- Eventos de negocio. Van AQUÍ, después del bucle y no después del insert de
  -- `pedidos`: `lineas` solo se puede contar cuando las líneas ya existen.
  --
  -- Al estar dentro de la misma transacción que el pedido, no puede haber un
  -- pedido sin evento ni un evento de pedido que no exista.
  --
  -- `payment.simulated` porque el pago es simulado: no hay pasarela real, así
  -- que el evento documenta que el cobro se dio por bueno, no que haya dinero.
  perform public.registrar_evento(
    'order.created', v_sesion,
    jsonb_build_object(
      'pedido_id', v_pedido_id,
      'lineas',    (select count(*) from public.items_pedido
                    where pedido_id = v_pedido_id),
      'subtotal',  v_subtotal,
      'iva',       v_iva,
      'total',     v_total,
      'moneda',    'EUR'
    )
  );

  perform public.registrar_evento(
    'payment.simulated', v_sesion,
    jsonb_build_object(
      'pedido_id',   v_pedido_id,
      'pago_id',     p_pago_id,
      'metodo_pago', p_metodo_pago,
      'importe',     v_total
    )
  );

  if v_propietario is not null then
    delete from public.carrito_items where user_id = v_propietario;
  else
    delete from public.carrito_items where session_id = v_sesion;
  end if;

  return v_pedido_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 10. Consultar un pedido por su identificador de pago
--
--     Es lo que usa /order-confirmation. Para invitados (usuario_id null)
--     basta con conocer el `cs_...` de Stripe, que es el mismo esquema que
--     usan los enlaces de "seguir mi pedido" en cualquier tienda.
-- ----------------------------------------------------------------------------

create or replace function public.pedido_por_pago(p_pago_id text)
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
      and (pe.usuario_id is null or pe.usuario_id = auth.uid())
    limit 1
  );
$$;

-- ----------------------------------------------------------------------------
-- 11. Lectura de pedidos con sesión iniciada
--     Sin esto, /account/orders y /order-confirmation devuelven vacío.
-- ----------------------------------------------------------------------------

drop policy if exists "pedidos_select_propio" on public.pedidos;
create policy "pedidos_select_propio"
  on public.pedidos
  for select
  to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "items_pedido_select_propio" on public.items_pedido;
create policy "items_pedido_select_propio"
  on public.items_pedido
  for select
  to authenticated
  using (
    exists (
      select 1 from public.pedidos pe
      where pe.id = items_pedido.pedido_id
        and pe.usuario_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 12. Permisos
-- ----------------------------------------------------------------------------

revoke execute on function public.carrito_get_items(text) from public;
revoke execute on function public.carrito_add_item(uuid, uuid, integer, text) from public;
revoke execute on function public.carrito_set_cantidad(uuid, integer, text) from public;
revoke execute on function public.carrito_remove_item(uuid, text) from public;
revoke execute on function public.carrito_clear(text) from public;
revoke execute on function public.carrito_merge(text) from public;
revoke execute on function public.crear_pedido(uuid, text, jsonb, text, text, numeric, numeric) from public;
revoke execute on function public.pedido_por_pago(text) from public;

grant execute on function public.carrito_get_items(text) to anon, authenticated;
grant execute on function public.carrito_add_item(uuid, uuid, integer, text) to anon, authenticated;
grant execute on function public.carrito_set_cantidad(uuid, integer, text) to anon, authenticated;
grant execute on function public.carrito_remove_item(uuid, text) to anon, authenticated;
grant execute on function public.carrito_clear(text) to anon, authenticated;
grant execute on function public.carrito_merge(text) to authenticated;

-- carrito_merge solo tiene sentido con usuario autenticado, pero crear el
-- pedido desde el webhook sí necesita ejecutarlo sin cookies de cliente.
grant execute on function public.crear_pedido(uuid, text, jsonb, text, text, numeric, numeric) to anon, authenticated;
grant execute on function public.pedido_por_pago(text) to anon, authenticated;
