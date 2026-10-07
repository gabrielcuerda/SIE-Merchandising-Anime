-- ============================================================================
-- Camiseta Eren Titan — variantes Color x Talla
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- Es idempotente: si el producto ya tiene variantes, no inserta nada
-- (guarda `not exists`). Aplicadas el 2026-10-06; este fichero es el
-- registro replayable si se resetea la BD.
--
-- Por qué filas y no código:
--   el carrito resuelve la variante desde la URL (`?color=&talla=`) y guarda
--   su `variante_id` real en `carrito_items`. Unas tallas inventadas en
--   código romperían el pedido; tienen que existir en `producto_variantes`.
-- ============================================================================

insert into producto_variantes (producto_id, titulo, sku, precio, stock, opciones)
select p.id,
  c.color || ' / ' || t.talla,
  'CAM-EREN-' || upper(substring(c.color, 1, 2)) || '-' || t.talla,
  p.precio,
  10,
  jsonb_build_array(
    jsonb_build_object('name', 'Color', 'value', c.color),
    jsonb_build_object('name', 'Talla', 'value', t.talla)
  )
from productos p
cross join (values ('Azul'), ('Roja'), ('Verde'), ('Negra'), ('Blanca')) as c(color)
cross join (values ('S'), ('M'), ('L'), ('XL')) as t(talla)
where p.slug = 'camiseta-attack-on-titan-eren-titan'
  and not exists (
    select 1 from producto_variantes v where v.producto_id = p.id
  );

-- Verificación (debe devolver 20 filas):
-- select v.titulo, v.sku, v.stock
-- from producto_variantes v
-- join productos p on p.id = v.producto_id
-- where p.slug = 'camiseta-attack-on-titan-eren-titan'
-- order by v.titulo;