-- Elite League · base de datos inicial
-- Esta migración se ejecuta en un proyecto Supabase nuevo. No contiene datos privados.

create extension if not exists pgcrypto;

create type public.global_role as enum ('member', 'admin');
create type public.club_role as enum ('president', 'staff', 'referee');
create type public.player_position_group as enum ('GK', 'FIELD');
create type public.phase_type as enum ('regular', 'playoff', 'play_in');
create type public.match_status as enum ('scheduled', 'live', 'reported', 'confirmed', 'cancelled');
create type public.lineup_state as enum ('draft', 'submitted', 'locked', 'published');
create type public.lineup_slot as enum ('GK', 'FIELD_1', 'FIELD_2', 'FIELD_3', 'FIELD_4');
create type public.result_resolution as enum ('normal', 'penalties', 'forfeit');
create type public.match_event_type as enum ('goal', 'assist', 'yellow_card', 'blue_card', 'red_card', 'mvp');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  global_role public.global_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique,
  short_name text not null,
  city text,
  founded_year smallint,
  primary_color text,
  crest_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  starts_on date,
  ends_on date,
  status text not null default 'draft' check (status in ('draft', 'upcoming', 'live', 'finished', 'archived')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competition_phases (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  slug text not null,
  name text not null,
  phase_type public.phase_type not null default 'regular',
  sort_order smallint not null default 1,
  rules jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, slug),
  unique (season_id, sort_order)
);

create table public.phase_clubs (
  phase_id uuid not null references public.competition_phases(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete restrict,
  seed smallint,
  status text not null default 'active' check (status in ('active', 'withdrawn', 'eliminated')),
  primary key (phase_id, club_id)
);

create table public.matchdays (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.competition_phases(id) on delete cascade,
  number smallint not null check (number > 0),
  title text,
  scheduled_for timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'current', 'completed')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, number)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  match_order smallint not null check (match_order > 0),
  home_club_id uuid not null references public.clubs(id) on delete restrict,
  away_club_id uuid not null references public.clubs(id) on delete restrict,
  status public.match_status not null default 'scheduled',
  kickoff_at timestamptz,
  lineup_deadline_at timestamptz,
  public_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (matchday_id, match_order),
  check (home_club_id <> away_club_id)
);

create table public.match_results (
  match_id uuid primary key references public.matches(id) on delete cascade,
  home_score smallint not null check (home_score >= 0),
  away_score smallint not null check (away_score >= 0),
  home_penalty_score smallint check (home_penalty_score >= 0),
  away_penalty_score smallint check (away_penalty_score >= 0),
  resolution public.result_resolution not null,
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  published_at timestamptz,
  note text,
  check (
    (resolution = 'normal' and home_score <> away_score and home_penalty_score is null and away_penalty_score is null)
    or (resolution = 'penalties' and home_score = away_score and home_penalty_score is not null and away_penalty_score is not null and home_penalty_score <> away_penalty_score)
    or (resolution = 'forfeit')
  )
);

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.club_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  public_name text not null,
  birth_year smallint check (birth_year between 1900 and 2100),
  image_path text,
  profile jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_player_registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete restrict,
  club_id uuid not null references public.clubs(id) on delete restrict,
  phase_id uuid not null references public.competition_phases(id) on delete cascade,
  shirt_number smallint check (shirt_number between 0 and 99),
  position_group public.player_position_group not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'released')),
  registered_at timestamptz not null default now(),
  released_at timestamptz,
  unique (player_id, phase_id),
  unique (club_id, phase_id, shirt_number)
);

create table public.lineup_submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  state public.lineup_state not null default 'draft',
  version integer not null default 1 check (version > 0),
  submitted_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz,
  locked_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, club_id)
);

create table public.lineup_slots (
  lineup_id uuid not null references public.lineup_submissions(id) on delete cascade,
  slot public.lineup_slot not null,
  registration_id uuid not null references public.club_player_registrations(id) on delete restrict,
  is_captain boolean not null default false,
  primary key (lineup_id, slot),
  unique (lineup_id, registration_id)
);

create table public.match_result_submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  home_score smallint not null check (home_score >= 0),
  away_score smallint not null check (away_score >= 0),
  home_penalty_score smallint check (home_penalty_score >= 0),
  away_penalty_score smallint check (away_penalty_score >= 0),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  evidence_path text,
  note text,
  unique (match_id, club_id)
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  event_type public.match_event_type not null,
  registration_id uuid references public.club_player_registrations(id) on delete set null,
  related_registration_id uuid references public.club_player_registrations(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  minute smallint check (minute >= 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.standings_adjustments (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.competition_phases(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  points_delta smallint not null,
  reason text not null,
  applied_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  excerpt text not null,
  body text,
  category text not null default 'Actualidad',
  cover_path text,
  is_featured boolean not null default false,
  published_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index matches_matchday_id_idx on public.matches(matchday_id);
create index matches_home_club_id_idx on public.matches(home_club_id);
create index matches_away_club_id_idx on public.matches(away_club_id);
create index matchdays_phase_id_idx on public.matchdays(phase_id);
create index registrations_phase_club_idx on public.club_player_registrations(phase_id, club_id);
create index membership_user_idx on public.club_memberships(user_id) where is_active;
create index lineup_match_club_idx on public.lineup_submissions(match_id, club_id);
create index match_events_match_idx on public.match_events(match_id);
create index audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger clubs_updated_at before update on public.clubs for each row execute procedure public.set_updated_at();
create trigger seasons_updated_at before update on public.seasons for each row execute procedure public.set_updated_at();
create trigger phases_updated_at before update on public.competition_phases for each row execute procedure public.set_updated_at();
create trigger matchdays_updated_at before update on public.matchdays for each row execute procedure public.set_updated_at();
create trigger matches_updated_at before update on public.matches for each row execute procedure public.set_updated_at();
create trigger players_updated_at before update on public.players for each row execute procedure public.set_updated_at();
create trigger lineups_updated_at before update on public.lineup_submissions for each row execute procedure public.set_updated_at();
create trigger news_updated_at before update on public.news_posts for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and global_role = 'admin'
  );
$$;

create or replace function public.is_club_member(target_club_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.club_memberships
    where club_id = target_club_id and user_id = auth.uid() and is_active
  );
$$;

create or replace function public.can_manage_club(target_club_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.club_memberships
    where club_id = target_club_id
      and user_id = auth.uid()
      and is_active
      and role in ('president', 'staff')
  );
$$;

create or replace function public.is_public_phase(target_phase_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.competition_phases phase
    join public.seasons season on season.id = phase.season_id
    where phase.id = target_phase_id and phase.is_public and season.is_public
  );
$$;

create or replace function public.is_public_lineup(target_lineup_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.lineup_submissions lineup
    join public.matches fixture on fixture.id = lineup.match_id
    join public.matchdays matchday on matchday.id = fixture.matchday_id
    where lineup.id = target_lineup_id
      and lineup.published_at is not null
      and matchday.is_public
      and public.is_public_phase(matchday.phase_id)
  );
$$;

create or replace function public.can_view_lineup(target_lineup_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.lineup_submissions
    where id = target_lineup_id
      and (public.is_public_lineup(id) or public.is_club_member(club_id))
  );
$$;

create or replace function public.submit_lineup(
  p_match_id uuid,
  p_registration_ids uuid[],
  p_state public.lineup_state default 'submitted'
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  target_match public.matches;
  target_club_id uuid;
  target_phase_id uuid;
  target_lineup_id uuid;
  selected_count integer;
  selected_goalkeepers integer;
  slot_index integer := 0;
  registration_id uuid;
  registration_position public.player_position_group;
begin
  select m.* into target_match
  from public.matches m
  where m.id = p_match_id
    and (public.can_manage_club(m.home_club_id) or public.can_manage_club(m.away_club_id));

  if not found then
    raise exception 'No tienes permiso para gestionar la alineación de este partido';
  end if;
  target_club_id := case
    when public.can_manage_club(target_match.home_club_id) then target_match.home_club_id
    else target_match.away_club_id
  end;
  if target_match.status in ('confirmed', 'cancelled') then
    raise exception 'El partido ya no admite alineaciones';
  end if;
  if target_match.lineup_deadline_at is not null and target_match.lineup_deadline_at <= now() and not public.is_admin() then
    raise exception 'La hora límite de alineaciones ha terminado';
  end if;
  if p_state not in ('draft', 'submitted') and not public.is_admin() then
    raise exception 'Solo administración puede bloquear o publicar una alineación';
  end if;
  if exists (
    select 1 from public.lineup_submissions
    where match_id = p_match_id and club_id = target_club_id and state in ('locked', 'published')
  ) and not public.is_admin() then
    raise exception 'La alineación ya está bloqueada y solo administración puede reabrirla';
  end if;
  if coalesce(array_length(p_registration_ids, 1), 0) <> 5 or cardinality(array(select distinct unnest(p_registration_ids))) <> 5 then
    raise exception 'La alineación debe tener cinco jugadores distintos';
  end if;

  select md.phase_id into target_phase_id
  from public.matchdays md where md.id = target_match.matchday_id;

  select count(*), count(*) filter (where cpr.position_group = 'GK')
    into selected_count, selected_goalkeepers
  from public.club_player_registrations cpr
  where cpr.id = any(p_registration_ids)
    and cpr.club_id = target_club_id
    and cpr.phase_id = target_phase_id
    and cpr.status = 'active';

  if selected_count <> 5 or selected_goalkeepers <> 1 then
    raise exception 'Selecciona cuatro jugadores de campo y un portero activos de tu club';
  end if;

  insert into public.lineup_submissions (match_id, club_id, state, submitted_by, submitted_at, locked_at, published_at, version)
  values (
    p_match_id,
    target_club_id,
    p_state,
    auth.uid(),
    case when p_state = 'submitted' then now() else null end,
    case when p_state in ('locked', 'published') then now() else null end,
    case when p_state = 'published' then now() else null end,
    1
  )
  on conflict (match_id, club_id) do update set
    state = excluded.state,
    submitted_by = excluded.submitted_by,
    submitted_at = case when excluded.state = 'submitted' then now() else public.lineup_submissions.submitted_at end,
    locked_at = case when excluded.state in ('locked', 'published') then now() else null end,
    published_at = case when excluded.state = 'published' then now() else null end,
    version = public.lineup_submissions.version + 1
  returning id into target_lineup_id;

  delete from public.lineup_slots where lineup_id = target_lineup_id;

  foreach registration_id in array p_registration_ids loop
    select position_group into registration_position from public.club_player_registrations where id = registration_id;
    if registration_position = 'GK' then
      insert into public.lineup_slots (lineup_id, slot, registration_id)
      values (target_lineup_id, 'GK', registration_id);
    else
      slot_index := slot_index + 1;
      insert into public.lineup_slots (lineup_id, slot, registration_id)
      values (target_lineup_id, ('FIELD_' || slot_index)::public.lineup_slot, registration_id);
    end if;
  end loop;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'lineup_submitted', 'lineup_submission', target_lineup_id, jsonb_build_object('match_id', p_match_id, 'club_id', target_club_id, 'state', p_state));
  return target_lineup_id;
end;
$$;

create or replace function public.confirm_match_result(
  p_match_id uuid,
  p_home_score smallint,
  p_away_score smallint,
  p_home_penalty_score smallint default null,
  p_away_penalty_score smallint default null,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  resolved_resolution public.result_resolution;
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede confirmar resultados';
  end if;
  if p_home_score < 0 or p_away_score < 0 then
    raise exception 'El marcador no puede ser negativo';
  end if;
  if p_home_score = p_away_score then
    if p_home_penalty_score is null or p_away_penalty_score is null or p_home_penalty_score = p_away_penalty_score then
      raise exception 'Un empate requiere una tanda de penaltis con ganador';
    end if;
    resolved_resolution := 'penalties';
  elsif p_home_penalty_score is not null or p_away_penalty_score is not null then
    raise exception 'Los penaltis solo se registran con empate';
  else
    resolved_resolution := 'normal';
  end if;

  insert into public.match_results (match_id, home_score, away_score, home_penalty_score, away_penalty_score, resolution, confirmed_by, published_at, note)
  values (p_match_id, p_home_score, p_away_score, p_home_penalty_score, p_away_penalty_score, resolved_resolution, auth.uid(), now(), p_note)
  on conflict (match_id) do update set
    home_score = excluded.home_score,
    away_score = excluded.away_score,
    home_penalty_score = excluded.home_penalty_score,
    away_penalty_score = excluded.away_penalty_score,
    resolution = excluded.resolution,
    confirmed_by = excluded.confirmed_by,
    confirmed_at = now(),
    published_at = now(),
    note = excluded.note;

  update public.matches set status = 'confirmed' where id = p_match_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'result_confirmed', 'match', p_match_id, jsonb_build_object('home_score', p_home_score, 'away_score', p_away_score, 'resolution', resolved_resolution));
end;
$$;

create or replace function public.configure_matchday(
  p_matchday_id uuid,
  p_status text,
  p_scheduled_for timestamptz default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_phase_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede configurar jornadas';
  end if;
  if p_status not in ('scheduled', 'current', 'completed') then
    raise exception 'Estado de jornada inválido';
  end if;

  select phase_id into target_phase_id from public.matchdays where id = p_matchday_id;
  if target_phase_id is null then
    raise exception 'No se ha encontrado la jornada';
  end if;

  if p_status = 'current' then
    update public.matchdays
    set status = 'scheduled'
    where phase_id = target_phase_id and status = 'current' and id <> p_matchday_id;
  end if;

  update public.matchdays
  set status = p_status, scheduled_for = p_scheduled_for
  where id = p_matchday_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'matchday_configured', 'matchday', p_matchday_id, jsonb_build_object('status', p_status, 'scheduled_for', p_scheduled_for));
end;
$$;

create or replace function public.configure_match_schedule(
  p_match_id uuid,
  p_kickoff_at timestamptz default null,
  p_lineup_deadline_at timestamptz default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede configurar partidos';
  end if;
  if p_kickoff_at is not null and p_lineup_deadline_at is not null and p_lineup_deadline_at > p_kickoff_at then
    raise exception 'La fecha límite de alineaciones no puede ser posterior al inicio del partido';
  end if;
  if not exists (select 1 from public.matches where id = p_match_id) then
    raise exception 'No se ha encontrado el partido';
  end if;

  update public.matches
  set kickoff_at = p_kickoff_at, lineup_deadline_at = p_lineup_deadline_at
  where id = p_match_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'match_schedule_configured', 'match', p_match_id, jsonb_build_object('kickoff_at', p_kickoff_at, 'lineup_deadline_at', p_lineup_deadline_at));
end;
$$;

create or replace function public.register_player(
  p_public_name text,
  p_club_id uuid,
  p_phase_id uuid,
  p_position_group public.player_position_group,
  p_shirt_number smallint default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_player_id uuid;
  new_registration_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede registrar jugadores';
  end if;
  if nullif(trim(p_public_name), '') is null then
    raise exception 'El jugador necesita un nombre público';
  end if;
  if not exists (
    select 1 from public.phase_clubs
    where phase_id = p_phase_id and club_id = p_club_id and status = 'active'
  ) then
    raise exception 'El club no participa en la fase seleccionada';
  end if;

  insert into public.players (public_name)
  values (trim(p_public_name))
  returning id into new_player_id;

  insert into public.club_player_registrations (player_id, club_id, phase_id, position_group, shirt_number)
  values (new_player_id, p_club_id, p_phase_id, p_position_group, p_shirt_number)
  returning id into new_registration_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'player_registered', 'club_player_registration', new_registration_id, jsonb_build_object('player_id', new_player_id, 'club_id', p_club_id, 'phase_id', p_phase_id));
  return new_registration_id;
end;
$$;

create or replace function public.publish_news(
  p_slug text,
  p_title text,
  p_excerpt text,
  p_category text default 'Actualidad'
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_news_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede publicar noticias';
  end if;
  if nullif(trim(p_slug), '') is null or nullif(trim(p_title), '') is null or nullif(trim(p_excerpt), '') is null then
    raise exception 'La noticia necesita slug, título y resumen';
  end if;

  insert into public.news_posts (slug, title, excerpt, category, published_at, author_id)
  values (trim(p_slug), trim(p_title), trim(p_excerpt), coalesce(nullif(trim(p_category), ''), 'Actualidad'), now(), auth.uid())
  returning id into new_news_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'news_published', 'news_post', new_news_id, jsonb_build_object('title', trim(p_title)));
  return new_news_id;
end;
$$;

create or replace function public.record_match_event(
  p_match_id uuid,
  p_registration_id uuid,
  p_event_type public.match_event_type,
  p_minute smallint default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  target_phase_id uuid;
  target_home_club_id uuid;
  target_away_club_id uuid;
  registration_club_id uuid;
  new_event_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede registrar eventos';
  end if;
  if p_minute is not null and (p_minute < 0 or p_minute > 99) then
    raise exception 'El minuto debe estar entre 0 y 99';
  end if;

  select matchday.phase_id, fixture.home_club_id, fixture.away_club_id
    into target_phase_id, target_home_club_id, target_away_club_id
  from public.matches fixture
  join public.matchdays matchday on matchday.id = fixture.matchday_id
  where fixture.id = p_match_id and fixture.status = 'confirmed';
  if target_phase_id is null then
    raise exception 'El partido debe estar confirmado antes de registrar eventos';
  end if;

  select club_id into registration_club_id
  from public.club_player_registrations
  where id = p_registration_id and phase_id = target_phase_id and status = 'active';
  if registration_club_id is null or registration_club_id not in (target_home_club_id, target_away_club_id) then
    raise exception 'El jugador no está inscrito en uno de los clubes del partido';
  end if;

  insert into public.match_events (match_id, event_type, registration_id, club_id, minute)
  values (p_match_id, p_event_type, p_registration_id, registration_club_id, p_minute)
  returning id into new_event_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'match_event_recorded', 'match_event', new_event_id, jsonb_build_object('match_id', p_match_id, 'registration_id', p_registration_id, 'event_type', p_event_type));
  return new_event_id;
end;
$$;

create or replace function public.get_phase_standings(p_phase_id uuid)
returns table (
  club_id uuid,
  "position" integer,
  played integer,
  wins integer,
  penalty_wins integer,
  penalty_losses integer,
  losses integer,
  goals_for integer,
  goals_against integer,
  goal_difference integer,
  points integer
)
language sql
stable
security invoker set search_path = public
as $$
  with appearances as (
    select
      m.home_club_id as club_id,
      m.id as match_id,
      r.home_score as goals_for,
      r.away_score as goals_against,
      r.home_penalty_score as penalties_for,
      r.away_penalty_score as penalties_against
    from public.matches m
    join public.matchdays md on md.id = m.matchday_id and md.phase_id = p_phase_id
    join public.match_results r on r.match_id = m.id and r.published_at is not null
    where m.status = 'confirmed'
    union all
    select
      m.away_club_id,
      m.id,
      r.away_score,
      r.home_score,
      r.away_penalty_score,
      r.home_penalty_score
    from public.matches m
    join public.matchdays md on md.id = m.matchday_id and md.phase_id = p_phase_id
    join public.match_results r on r.match_id = m.id and r.published_at is not null
    where m.status = 'confirmed'
  ),
  aggregated as (
    select
      pc.club_id,
      count(a.match_id)::integer as played,
      count(*) filter (where a.goals_for > a.goals_against)::integer as wins,
      count(*) filter (where a.goals_for = a.goals_against and a.penalties_for > a.penalties_against)::integer as penalty_wins,
      count(*) filter (where a.goals_for = a.goals_against and a.penalties_for < a.penalties_against)::integer as penalty_losses,
      count(*) filter (where a.goals_for < a.goals_against)::integer as losses,
      coalesce(sum(a.goals_for), 0)::integer as goals_for,
      coalesce(sum(a.goals_against), 0)::integer as goals_against,
      coalesce(sum(
        case
          when a.goals_for > a.goals_against then 3
          when a.goals_for = a.goals_against and a.penalties_for > a.penalties_against then 2
          when a.goals_for = a.goals_against and a.penalties_for < a.penalties_against then 1
          else 0
        end
      ), 0)::integer as base_points
    from public.phase_clubs pc
    left join appearances a on a.club_id = pc.club_id
    where pc.phase_id = p_phase_id
      and exists (
        select 1
        from public.competition_phases visible_phase
        join public.seasons visible_season on visible_season.id = visible_phase.season_id
        where visible_phase.id = p_phase_id
          and ((visible_phase.is_public and visible_season.is_public) or public.is_admin())
      )
    group by pc.club_id
  ),
  with_adjustments as (
    select
      a.*,
      coalesce((select sum(sa.points_delta) from public.standings_adjustments sa where sa.phase_id = p_phase_id and sa.club_id = a.club_id), 0)::integer as adjustment
    from aggregated a
  ),
  ranked as (
    select
      wa.club_id,
      row_number() over (order by wa.base_points + wa.adjustment desc, wa.goals_for - wa.goals_against desc, wa.goals_for desc, wa.wins desc, c.name asc)::integer as position,
      wa.played, wa.wins, wa.penalty_wins, wa.penalty_losses, wa.losses, wa.goals_for, wa.goals_against,
      wa.goals_for - wa.goals_against as goal_difference,
      wa.base_points + wa.adjustment as points
    from with_adjustments wa join public.clubs c on c.id = wa.club_id
  )
  select * from ranked order by position;
$$;

-- RLS: el frontend puede leer el contenido público, pero cualquier acción sensible se valida en servidor.
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.seasons enable row level security;
alter table public.competition_phases enable row level security;
alter table public.phase_clubs enable row level security;
alter table public.matchdays enable row level security;
alter table public.matches enable row level security;
alter table public.match_results enable row level security;
alter table public.club_memberships enable row level security;
alter table public.players enable row level security;
alter table public.club_player_registrations enable row level security;
alter table public.lineup_submissions enable row level security;
alter table public.lineup_slots enable row level security;
alter table public.match_result_submissions enable row level security;
alter table public.match_events enable row level security;
alter table public.standings_adjustments enable row level security;
alter table public.news_posts enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_read_self_or_admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "clubs_public_read" on public.clubs for select using (true);
create policy "clubs_admin_manage" on public.clubs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "seasons_public_read" on public.seasons for select using (is_public or public.is_admin());
create policy "seasons_admin_manage" on public.seasons for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "phases_public_read" on public.competition_phases for select using (
  public.is_admin() or (
    is_public
    and exists (select 1 from public.seasons where id = competition_phases.season_id and is_public)
  )
);
create policy "phases_admin_manage" on public.competition_phases for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "phase_clubs_public_read" on public.phase_clubs for select using (public.is_public_phase(phase_id) or public.is_admin());
create policy "phase_clubs_admin_manage" on public.phase_clubs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "matchdays_public_read" on public.matchdays for select using ((is_public and public.is_public_phase(phase_id)) or public.is_admin());
create policy "matchdays_admin_manage" on public.matchdays for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "matches_public_read" on public.matches for select using (
  public.is_admin() or (
    public_at is not null
    and exists (select 1 from public.matchdays where id = matches.matchday_id and is_public and public.is_public_phase(phase_id))
  )
);
create policy "matches_admin_manage" on public.matches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "results_public_read" on public.match_results for select using (
  public.is_admin() or (
    published_at is not null
    and exists (
      select 1
      from public.matches fixture
      join public.matchdays matchday on matchday.id = fixture.matchday_id
      where fixture.id = match_results.match_id and matchday.is_public and public.is_public_phase(matchday.phase_id)
    )
  )
);
create policy "results_admin_manage" on public.match_results for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "memberships_read_own_or_admin" on public.club_memberships for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "memberships_admin_manage" on public.club_memberships for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "players_public_read" on public.players for select using (is_public or public.is_admin());
create policy "players_admin_manage" on public.players for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "registrations_public_read" on public.club_player_registrations for select using (public.is_public_phase(phase_id) or public.is_admin());
create policy "registrations_admin_manage" on public.club_player_registrations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lineups_view_own_or_published" on public.lineup_submissions for select to authenticated using (public.is_public_lineup(id) or public.is_club_member(club_id));
create policy "lineups_public_read_published" on public.lineup_submissions for select to anon using (public.is_public_lineup(id));
create policy "lineups_admin_manage" on public.lineup_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lineup_slots_view_allowed" on public.lineup_slots for select to authenticated using (public.can_view_lineup(lineup_id));
create policy "lineup_slots_public_read_published" on public.lineup_slots for select to anon using (public.can_view_lineup(lineup_id));
create policy "lineup_slots_admin_manage" on public.lineup_slots for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "result_submissions_view_own_or_admin" on public.match_result_submissions for select to authenticated using (public.is_club_member(club_id));
create policy "result_submissions_create_own" on public.match_result_submissions for insert to authenticated with check (
  public.can_manage_club(club_id)
  and submitted_by = auth.uid()
  and exists (
    select 1
    from public.matches
    where id = match_id
      and (home_club_id = club_id or away_club_id = club_id)
  )
);
create policy "result_submissions_admin_manage" on public.match_result_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "match_events_public_read" on public.match_events for select using (
  public.is_admin() or exists (
    select 1
    from public.match_results result
    join public.matches fixture on fixture.id = result.match_id
    join public.matchdays matchday on matchday.id = fixture.matchday_id
    where result.match_id = match_events.match_id
      and result.published_at is not null
      and matchday.is_public
      and public.is_public_phase(matchday.phase_id)
  )
);
create policy "match_events_admin_manage" on public.match_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "adjustments_public_read" on public.standings_adjustments for select using (public.is_public_phase(phase_id) or public.is_admin());
create policy "adjustments_admin_manage" on public.standings_adjustments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "news_public_read" on public.news_posts for select using (published_at is not null or public.is_admin());
create policy "news_admin_manage" on public.news_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audit_admin_read" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "audit_admin_manage" on public.audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Supabase puede otorgar ALL por defecto. Los GRANT de columna no eliminan
-- un UPDATE previo de tabla: retirarlo evita que un usuario se haga admin.
-- También retiramos TRUNCATE y demás permisos que no pasan por las políticas.
revoke all on public.profiles, public.clubs, public.seasons, public.competition_phases,
  public.phase_clubs, public.matchdays, public.matches, public.match_results,
  public.club_memberships, public.players, public.club_player_registrations,
  public.lineup_submissions, public.lineup_slots, public.match_result_submissions,
  public.match_events, public.standings_adjustments, public.news_posts, public.audit_logs
  from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.clubs, public.seasons, public.competition_phases, public.phase_clubs, public.matchdays, public.matches, public.match_results, public.players, public.club_player_registrations, public.lineup_submissions, public.lineup_slots, public.match_events, public.standings_adjustments, public.news_posts to anon, authenticated;
grant select on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.club_memberships, public.match_result_submissions, public.audit_logs to authenticated;
grant insert, update, delete on public.clubs, public.seasons, public.competition_phases, public.phase_clubs, public.matchdays, public.matches, public.match_results, public.players, public.club_player_registrations, public.lineup_submissions, public.lineup_slots, public.match_events, public.standings_adjustments, public.news_posts to authenticated;
revoke execute on function public.submit_lineup(uuid, uuid[], public.lineup_state) from public;
revoke execute on function public.confirm_match_result(uuid, smallint, smallint, smallint, smallint, text) from public;
revoke execute on function public.configure_matchday(uuid, text, timestamptz) from public;
revoke execute on function public.configure_match_schedule(uuid, timestamptz, timestamptz) from public;
revoke execute on function public.register_player(text, uuid, uuid, public.player_position_group, smallint) from public;
revoke execute on function public.publish_news(text, text, text, text) from public;
revoke execute on function public.record_match_event(uuid, uuid, public.match_event_type, smallint) from public;
grant execute on function public.get_phase_standings(uuid) to anon, authenticated;
grant execute on function public.submit_lineup(uuid, uuid[], public.lineup_state) to authenticated;
grant execute on function public.confirm_match_result(uuid, smallint, smallint, smallint, smallint, text) to authenticated;
grant execute on function public.configure_matchday(uuid, text, timestamptz) to authenticated;
grant execute on function public.configure_match_schedule(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.register_player(text, uuid, uuid, public.player_position_group, smallint) to authenticated;
grant execute on function public.publish_news(text, text, text, text) to authenticated;
grant execute on function public.record_match_event(uuid, uuid, public.match_event_type, smallint) to authenticated;

-- Recursos públicos permitidos: escudos, fotos autorizadas, portadas y material editorial optimizado.
insert into storage.buckets (id, name, public)
values ('elite-public', 'elite-public', true)
on conflict (id) do nothing;

create policy "elite_public_assets_read" on storage.objects
  for select using (bucket_id = 'elite-public');
create policy "elite_public_assets_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'elite-public' and public.is_admin());
create policy "elite_public_assets_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'elite-public' and public.is_admin()) with check (bucket_id = 'elite-public' and public.is_admin());
create policy "elite_public_assets_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'elite-public' and public.is_admin());
