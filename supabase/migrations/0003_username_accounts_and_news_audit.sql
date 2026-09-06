-- Incremental migration. Does not create accounts or modify competition data.
begin;

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists must_change_password boolean not null default false;
create unique index if not exists profiles_username_unique on public.profiles (username) where username is not null;
-- Canonical president/club alias. Auth maps the slash to --; neither part permits hyphens.
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9]{1,24}/[a-z0-9]{1,20}$');

-- These columns are managed only by the server, not by profile metadata.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and global_role = 'admin' and not must_change_password); $$;

create or replace function public.can_manage_club(target_club_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.club_memberships member
    join public.profiles profile on profile.id = member.user_id
    where member.club_id = target_club_id and member.user_id = auth.uid()
      and member.is_active and member.role in ('president', 'staff') and not profile.must_change_password
  );
$$;

-- Audit every editorial write in the same transaction, including drafts and withdrawal.
create or replace function public.audit_news_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare event_name text;
begin
  if TG_OP = 'DELETE' then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data)
    values (auth.uid(), 'news_deleted', 'news_post', OLD.id, jsonb_build_object('title', OLD.title));
    return OLD;
  end if;
  if TG_OP = 'INSERT' then
    event_name := case when NEW.published_at is null then 'news_draft_saved' else 'news_published' end;
  elsif OLD.published_at is not null and NEW.published_at is null then event_name := 'news_withdrawn';
  elsif OLD.published_at is null and NEW.published_at is not null then event_name := 'news_published';
  else event_name := case when NEW.published_at is null then 'news_draft_saved' else 'news_updated' end;
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), event_name, 'news_post', NEW.id, jsonb_build_object('title', NEW.title, 'published_at', NEW.published_at, 'featured', NEW.is_featured));
  return NEW;
end;
$$;
create trigger news_changes_audited after insert or update or delete on public.news_posts
for each row execute function public.audit_news_change();
revoke execute on function public.audit_news_change() from public;

-- Preserve the legacy RPC without duplicate audit entries (the trigger handles it).
create or replace function public.publish_news(p_slug text, p_title text, p_excerpt text, p_category text default 'Actualidad')
returns uuid language plpgsql security definer set search_path = public
as $$
declare new_news_id uuid;
begin
  if not public.is_admin() then raise exception 'Solo administración puede publicar noticias'; end if;
  if nullif(trim(p_slug), '') is null or nullif(trim(p_title), '') is null or nullif(trim(p_excerpt), '') is null then raise exception 'La noticia necesita slug, título y resumen'; end if;
  insert into public.news_posts (slug, title, excerpt, category, published_at, author_id)
  values (trim(p_slug), trim(p_title), trim(p_excerpt), coalesce(nullif(trim(p_category), ''), 'Actualidad'), now(), auth.uid()) returning id into new_news_id;
  return new_news_id;
end;
$$;

drop policy news_public_read on public.news_posts;
create policy news_public_read on public.news_posts for select using ((published_at is not null and published_at <= now()) or public.is_admin());
commit;
