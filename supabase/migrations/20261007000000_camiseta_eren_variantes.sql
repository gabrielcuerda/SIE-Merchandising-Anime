-- Variantes Color x Talla para la camiseta Eren Titan.
-- Ya aplicadas el 2026-10-06 via SQL editor; este fichero es el registro
-- replayable. Idempotente: si existen variantes, no inserta nada.
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