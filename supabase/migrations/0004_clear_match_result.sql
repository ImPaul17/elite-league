-- Only defines an admin operation; applying this migration changes no results.
begin;

create or replace function public.clear_match_result(p_match_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  previous_status public.match_status;
  previous_result public.match_results%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Solo administración puede borrar resultados';
  end if;

  select status into previous_status from public.matches where id = p_match_id;
  if not found then
    raise exception 'No se ha encontrado el partido seleccionado';
  end if;

  -- Lock the result before updating its fixture, matching confirm_match_result.
  delete from public.match_results where match_id = p_match_id returning * into previous_result;
  if not found then
    raise exception 'Este partido no tiene ningún resultado guardado';
  end if;

  -- Keep the fixture, schedule, lineups and events. Public event RLS and the
  -- live standings query already exclude matches without a published result.
  update public.matches set status = 'scheduled' where id = p_match_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(), 'result_cleared', 'match', p_match_id,
    jsonb_build_object('status', previous_status, 'result', to_jsonb(previous_result)),
    jsonb_build_object('status', 'scheduled', 'result', null)
  );
end;
$$;

revoke execute on function public.clear_match_result(uuid) from public, anon;
grant execute on function public.clear_match_result(uuid) to authenticated;

commit;
