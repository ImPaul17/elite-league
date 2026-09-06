-- Perfil institucional público de cada club.
-- Se mantiene separado de la primera migración para actualizar instalaciones ya creadas.

alter table public.clubs
  add column if not exists founder_name text,
  add column if not exists representative_colors text[] not null default '{}'::text[],
  add column if not exists competitive_honours jsonb not null default '[]'::jsonb;

alter table public.clubs
  drop constraint if exists clubs_competitive_honours_array;

alter table public.clubs
  add constraint clubs_competitive_honours_array
  check (jsonb_typeof(competitive_honours) = 'array');
