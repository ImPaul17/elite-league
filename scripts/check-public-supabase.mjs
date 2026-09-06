import assert from 'node:assert/strict';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('production', process.cwd(), 'VITE_');
assert.ok(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Falta configurar Supabase');
assert.ok(env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_'), 'Usar solo una clave pública');
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const [table, expected] of [['clubs', 12], ['matchdays', 11], ['matches', 66], ['players', 0], ['news_posts', 0]]) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  assert.equal(error, null, `${table}: ${error?.message}`);
  assert.equal(count, expected, `${table}: número inesperado`);
  console.log(`${table}: ${count}, lectura pública correcta`);
}

const { data: phase, error: phaseError } = await client.from('competition_phases').select('id').eq('slug', 'regular').single();
assert.equal(phaseError, null);
const { data: standings, error: standingsError } = await client.rpc('get_phase_standings', { p_phase_id: phase.id });
assert.equal(standingsError, null, standingsError?.message);
assert.equal(standings.length, 12);
assert.ok(standings.every((row) => row.points === 0 && row.played === 0));
console.log('Clasificación: 12 clubes, sin resultados inventados');

for (const table of ['profiles', 'club_memberships', 'audit_logs']) {
  const { data, error } = await client.from(table).select('*').limit(1);
  assert.ok(error?.code === '42501' || (!error && data.length === 0), `${table}: no debe revelar datos privados`);
  console.log(`${table}: acceso anónimo protegido`);
}

const functionUrl = `${env.VITE_SUPABASE_URL}/functions/v1/invite-president`;
for (const authorization of [null, 'Bearer invalid-test-token']) {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      Origin: 'https://eliteleague.qd.je',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: '{}',
  });
  assert.equal(response.status, 401, 'Las invitaciones deben rechazar sesiones ausentes o inválidas');
}
console.log('Invitaciones: acceso sin sesión y con token inválido rechazado (401)');
