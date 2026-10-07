-- ============================================================================
-- Camiseta Eren Titan — fotos en Supabase Storage
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- Re-ejecutable: borra y re-inserta las 5 filas (mismo resultado siempre).
-- Requiere que las fotos existan en el bucket público `productos` con los
-- nombres azul/roja/verde/negra/blanca.jpg.
--
-- ============================================================================

delete from producto_imagenes
where producto_id in (
  select id from productos where slug = 'camiseta-attack-on-titan-eren-titan'
);

insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/azul.jpg', 'Camiseta Eren Titan azul', 0
from productos where slug = 'camiseta-attack-on-titan-eren-titan';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/roja.jpg', 'Camiseta Eren Titan roja', 1
from productos where slug = 'camiseta-attack-on-titan-eren-titan';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/verde.jpg', 'Camiseta Eren Titan verde', 2
from productos where slug = 'camiseta-attack-on-titan-eren-titan';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/negra.jpg', 'Camiseta Eren Titan negra', 3
from productos where slug = 'camiseta-attack-on-titan-eren-titan';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/blanca.jpg', 'Camiseta Eren Titan blanca', 4
from productos where slug = 'camiseta-attack-on-titan-eren-titan';

-- Verificación (debe devolver 5 filas ordenadas 0-4):
-- select url, alt_text, orden_cat from producto_imagenes
-- where producto_id in (
--   select id from productos where slug = 'camiseta-attack-on-titan-eren-titan'
-- ) order by orden_cat;