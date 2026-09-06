-- Datos públicos iniciales. Ejecutar después de todas las migraciones, incluida 0002.
-- No se importan jugadores ni se publican noticias de demostración.

insert into public.clubs (slug, name, short_name, city, founded_year, primary_color, representative_colors, founder_name, competitive_honours, crest_path) values
  ('pico-fc', 'Pico FC', 'Pico', 'Madrid', 2023, '#1a9d40', array['#1a9d40'], 'Pablo', '["Campeón: Liga 2º Split", "Campeón: 1ª edición de la Elite Cup"]'::jsonb, '/clubs/512/pico-fc.webp'),
  ('ca-coca-jrs', 'CA Coca Jrs', 'Coca', 'Madrid', 2023, '#103f79', array['#103f79', '#f3b229'], 'Álvaro S.', '["Campeón: Liga 1º Split"]'::jsonb, '/clubs/512/ca-coca-jrs.webp'),
  ('urss-fc', 'URSS FC', 'URSS', 'Madrid', 2023, '#e80e37', array['#e80e37', '#f6cb22'], 'Juan', '[]'::jsonb, '/clubs/512/urss-fc.webp'),
  ('bee-fc', 'BEE FC', 'BEE', 'Madrid', 2023, '#ffffff', array['#ffffff', '#ceb633'], 'Bea', '[]'::jsonb, '/clubs/512/bee-fc.webp'),
  ('los-mugiwaras-fc', 'Los Mugiwaras FC', 'Mugiwaras', 'Madrid', 2023, '#b01515', array['#b01515', '#1b1f31'], 'Dani R.', '[]'::jsonb, '/clubs/512/los-mugiwaras-fc.webp'),
  ('impuestos-fc', 'Impuestos FC', 'Impuestos', 'Madrid', 2023, '#f2ea42', array['#f2ea42'], 'Alfonso', '[]'::jsonb, '/clubs/512/impuestos-fc.webp'),
  ('maki-fc', 'Maki FC', 'Maki', 'Madrid', 2023, '#e25211', array['#e25211'], 'Maki', '[]'::jsonb, '/clubs/512/maki-fc.webp'),
  ('lego-fc', 'Lego FC', 'Lego', 'Madrid', 2023, '#e47f00', array['#e47f00'], 'Adrián', '[]'::jsonb, '/clubs/512/lego-fc.webp'),
  ('rayo-zeta', 'Rayo Zeta', 'Rayo', 'Madrid', 2023, '#51b6b7', array['#51b6b7', '#000000'], 'Álvaro G.', '["Campeón: Play-Offs del 1º Split", "Campeón: Play-Offs del 2º Split"]'::jsonb, '/clubs/512/rayo-zeta.webp'),
  ('estaross-fc', 'Estaross FC', 'Estaross', 'Madrid', 2023, '#931dd7', array['#931dd7', '#000000'], 'Pedro', '[]'::jsonb, '/clubs/512/estaross-fc.webp'),
  ('karasuno-falcons', 'Karasuno Falcons', 'Karasuno', 'Madrid', 2025, '#ea7118', array['#ea7118', '#101010'], 'Isaac', '[]'::jsonb, '/clubs/512/karasuno-falcons.webp'),
  ('el-caudillo-fc', 'El Caudillo FC', 'Caudillo', 'Madrid', 2025, '#9a1e15', array['#9a1e15', '#dcae3e'], 'Dani D.', '[]'::jsonb, '/clubs/512/el-caudillo-fc.webp')
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  founded_year = excluded.founded_year,
  primary_color = excluded.primary_color,
  representative_colors = excluded.representative_colors,
  founder_name = excluded.founder_name,
  competitive_honours = excluded.competitive_honours,
  crest_path = excluded.crest_path;

insert into public.seasons (slug, name, status, is_public)
values ('elite-league-split-3', 'Elite League · Split 3', 'upcoming', true)
on conflict (slug) do update set name = excluded.name, status = excluded.status, is_public = excluded.is_public;

insert into public.competition_phases (season_id, slug, name, phase_type, sort_order, rules, is_public)
select id, 'regular', 'Split 3 · Liga regular', 'regular', 1,
  '{"points":{"win":3,"penalty_win":2,"penalty_loss":1,"loss":0},"tiebreakers":["points","goal_difference","goals_for","wins"],"lineup":{"field_players":4,"goalkeepers":1}}'::jsonb,
  true
from public.seasons where slug = 'elite-league-split-3'
on conflict (season_id, slug) do update set rules = excluded.rules, is_public = excluded.is_public;

insert into public.phase_clubs (phase_id, club_id, seed)
select phase.id, club.id, row_number() over (order by club.name)::smallint
from public.competition_phases phase
join public.seasons season on season.id = phase.season_id and season.slug = 'elite-league-split-3'
cross join public.clubs club
where phase.slug = 'regular'
on conflict (phase_id, club_id) do nothing;

insert into public.matchdays (phase_id, number, title, status, is_public)
select phase.id, gs.n, 'Jornada ' || lpad(gs.n::text, 2, '0'), case when gs.n = 1 then 'current' else 'scheduled' end, true
from public.competition_phases phase
join public.seasons season on season.id = phase.season_id and season.slug = 'elite-league-split-3'
cross join generate_series(1, 11) as gs(n)
where phase.slug = 'regular'
on conflict (phase_id, number) do update set status = excluded.status, is_public = excluded.is_public;

with fixtures (matchday_number, match_order, home_slug, away_slug) as (
  values
    (1,1,'pico-fc','rayo-zeta'),(1,2,'urss-fc','ca-coca-jrs'),(1,3,'impuestos-fc','karasuno-falcons'),(1,4,'bee-fc','lego-fc'),(1,5,'estaross-fc','los-mugiwaras-fc'),(1,6,'maki-fc','el-caudillo-fc'),
    (2,1,'urss-fc','el-caudillo-fc'),(2,2,'maki-fc','estaross-fc'),(2,3,'karasuno-falcons','pico-fc'),(2,4,'lego-fc','ca-coca-jrs'),(2,5,'rayo-zeta','bee-fc'),(2,6,'los-mugiwaras-fc','impuestos-fc'),
    (3,1,'estaross-fc','ca-coca-jrs'),(3,2,'maki-fc','bee-fc'),(3,3,'pico-fc','urss-fc'),(3,4,'rayo-zeta','karasuno-falcons'),(3,5,'impuestos-fc','el-caudillo-fc'),(3,6,'lego-fc','los-mugiwaras-fc'),
    (4,1,'pico-fc','ca-coca-jrs'),(4,2,'bee-fc','impuestos-fc'),(4,3,'maki-fc','los-mugiwaras-fc'),(4,4,'karasuno-falcons','urss-fc'),(4,5,'rayo-zeta','el-caudillo-fc'),(4,6,'lego-fc','estaross-fc'),
    (5,1,'los-mugiwaras-fc','bee-fc'),(5,2,'el-caudillo-fc','estaross-fc'),(5,3,'karasuno-falcons','lego-fc'),(5,4,'rayo-zeta','ca-coca-jrs'),(5,5,'urss-fc','impuestos-fc'),(5,6,'maki-fc','pico-fc'),
    (6,1,'impuestos-fc','ca-coca-jrs'),(6,2,'bee-fc','el-caudillo-fc'),(6,3,'pico-fc','estaross-fc'),(6,4,'karasuno-falcons','los-mugiwaras-fc'),(6,5,'maki-fc','rayo-zeta'),(6,6,'lego-fc','urss-fc'),
    (7,1,'los-mugiwaras-fc','rayo-zeta'),(7,2,'el-caudillo-fc','pico-fc'),(7,3,'karasuno-falcons','ca-coca-jrs'),(7,4,'urss-fc','bee-fc'),(7,5,'estaross-fc','impuestos-fc'),(7,6,'maki-fc','lego-fc'),
    (8,1,'bee-fc','ca-coca-jrs'),(8,2,'los-mugiwaras-fc','el-caudillo-fc'),(8,3,'karasuno-falcons','estaross-fc'),(8,4,'rayo-zeta','impuestos-fc'),(8,5,'lego-fc','pico-fc'),(8,6,'maki-fc','urss-fc'),
    (9,1,'los-mugiwaras-fc','ca-coca-jrs'),(9,2,'el-caudillo-fc','lego-fc'),(9,3,'urss-fc','rayo-zeta'),(9,4,'impuestos-fc','pico-fc'),(9,5,'estaross-fc','bee-fc'),(9,6,'karasuno-falcons','maki-fc'),
    (10,1,'bee-fc','karasuno-falcons'),(10,2,'pico-fc','los-mugiwaras-fc'),(10,3,'el-caudillo-fc','ca-coca-jrs'),(10,4,'maki-fc','impuestos-fc'),(10,5,'lego-fc','rayo-zeta'),(10,6,'estaross-fc','urss-fc'),
    (11,1,'pico-fc','bee-fc'),(11,2,'el-caudillo-fc','karasuno-falcons'),(11,3,'urss-fc','los-mugiwaras-fc'),(11,4,'impuestos-fc','lego-fc'),(11,5,'estaross-fc','rayo-zeta'),(11,6,'maki-fc','ca-coca-jrs')
)
insert into public.matches (matchday_id, match_order, home_club_id, away_club_id, status, public_at)
select md.id, f.match_order, home_club.id, away_club.id, 'scheduled', now()
from fixtures f
join public.competition_phases phase on phase.slug = 'regular'
join public.seasons season on season.id = phase.season_id and season.slug = 'elite-league-split-3'
join public.matchdays md on md.phase_id = phase.id and md.number = f.matchday_number
join public.clubs home_club on home_club.slug = f.home_slug
join public.clubs away_club on away_club.slug = f.away_slug
on conflict (matchday_id, match_order) do update set home_club_id = excluded.home_club_id, away_club_id = excluded.away_club_id, public_at = excluded.public_at;
