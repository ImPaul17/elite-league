import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const files = ['supabase/migrations/0001_elite_league.sql', 'supabase/migrations/0002_club_profiles.sql', 'supabase/seed.sql'];
const sources = await Promise.all(files.map((file) => readFile(new URL(file, root), 'utf8')));
const guard = `do $$ begin
  if exists (select 1 from pg_tables where schemaname = 'public') then
    raise exception 'La instalación inicial requiere una base pública vacía';
  end if;
end $$;`;
const verification = `do $$ begin
  if (select count(*) from public.clubs) <> 12
    or (select count(*) from public.matchdays) <> 11
    or (select count(*) from public.matches) <> 66 then
    raise exception 'Los datos iniciales están incompletos';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'global_role', 'UPDATE')
    or has_table_privilege('anon', 'public.clubs', 'TRUNCATE') then
    raise exception 'Se han detectado permisos excesivos';
  end if;
end $$;`;
const sql = ['begin;', guard, ...sources, verification, 'commit;'].join('\n\n');
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Instalación Supabase · Elite League</title>
<style>body{font:16px system-ui;margin:32px;background:#111;color:#eee}textarea{width:100%;height:70vh;font:12px monospace}button{padding:12px 20px;margin:12px 0}</style>
<h1>Instalación inicial de Elite League</h1><p>Solo para el proyecto nuevo ujsexqffgmkxzyvvholp. 12 clubes, 11 jornadas, 66 partidos; sin jugadores ni noticias demo.</p>
<button id="copy">Copiar SQL de instalación</button><span id="status" role="status"></span>
<textarea readonly aria-label="SQL de instalación">${escapeHtml(sql)}</textarea>
<script>document.querySelector('#copy').onclick=async()=>{await navigator.clipboard.writeText(document.querySelector('textarea').value);document.querySelector('#status').textContent='SQL copiado';};</script></html>`;
const output = new URL('supabase/.temp/', root);
await mkdir(output, { recursive: true });
await writeFile(new URL('setup.sql', output), sql);
await writeFile(new URL('setup.html', output), html);
const edgeSource = await readFile(new URL('supabase/functions/invite-president/index.ts', root), 'utf8');
await writeFile(new URL('edge.html', output), `<!doctype html><html lang="es"><meta charset="utf-8"><title>Función de invitaciones · Elite League</title><h1>invite-president</h1><textarea readonly aria-label="Código de invitaciones" style="width:100%;height:80vh">${escapeHtml(edgeSource)}</textarea></html>`);
console.log(`Preparado ${fileURLToPath(new URL('setup.html', output))}`);
