Lo mismo de arriba, con esta cabecera delante:
-- ============================================================================
-- Fotos de los 10 productos restantes en Supabase Storage
--
-- Ejecutar en: Supabase Studio > SQL Editor > New query > Run
-- ============================================================================

delete from producto_imagenes where url in (
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/29cm-Chainsaw-Man-Denji-Anime-Figure-Denji-Power.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/gojo.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/VJUMP-EXCLUSIVE-GOKU-GOHAN-BEAST.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/LXSTUDIO_ONEPIECENIKALUFFY_4.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/Naruto.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/naruto.jpeg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/rengoku.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/sukuna.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/Sukuna.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/tanjiro.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/dragon-ball-super-vegeta-ultra-ego-sp-studio.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/vegeta.jpg',
  'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/zoro.jpg'
);

insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/29cm-Chainsaw-Man-Denji-Anime-Figure-Denji-Power.jpg', 'Figura Denji Chainsaw Man', 0
from productos where slug = 'denji-chainsaw-transformation';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/gojo.jpg', 'Figura Gojo Satoru Infinite Void', 0
from productos where slug = 'gojo-infinite-void';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/VJUMP-EXCLUSIVE-GOKU-GOHAN-BEAST.jpg', 'Figura Goku y Gohan Beast', 0
from productos where slug = 'goku-gohan-beast-vjump-exclusive';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/LXSTUDIO_ONEPIECENIKALUFFY_4.jpg', 'Figura Luffy Gear 5', 0
from productos where slug = 'luffy-gear-5-nikkei';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/naruto.jpeg', 'Figura Naruto modo Sabio', 0
from productos where slug = 'naruto-sage-mode-remastered';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/rengoku.jpg', 'Figura Rengoku', 0
from productos where slug = 'rengoku-flame-hashira';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/Sukuna.jpg', 'Figura Sukuna Ryomen', 0
from productos where slug = 'sukuna-ryomen-artfx';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/tanjiro.jpg', 'Figura Tanjiro Kamado', 0
from productos where slug = 'tanjiro-flame-breathing';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/vegeta.jpg', 'Figura Vegeta Ultra Ego', 0
from productos where slug = 'vegeta-ultra-ego-limited';
insert into producto_imagenes (producto_id, url, alt_text, orden_cat)
select id, 'https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos/zoro.jpg', 'Figura Zoro Wano', 0
from productos where slug = 'zoro-wano-country';