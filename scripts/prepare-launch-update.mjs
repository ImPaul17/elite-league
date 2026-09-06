import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

// Generates local copy/paste helpers; does not connect to or mutate Supabase.
const root = new URL('../', import.meta.url);
const output = new URL('supabase/.temp/', root);
await mkdir(output, { recursive: true });
const sql = await readFile(new URL('supabase/migrations/0003_username_accounts_and_news_audit.sql', root), 'utf8');
const bundle = await build({ entryPoints: [fileURLToPath(new URL('supabase/functions/club-accounts/index.ts', root))], bundle: true, write: false, format: 'esm', platform: 'neutral', external: ['https://*'], legalComments: 'none' });
const legacy = await readFile(new URL('supabase/functions/invite-president/index.ts', root), 'utf8');
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const parts = [['SQL incremental 0003', sql], ['club-accounts', bundle.outputFiles[0].text], ['invite-president desactivado', legacy]];
await writeFile(new URL('launch-update.html', output), `<!doctype html><html lang="es"><meta charset="utf-8"><title>Actualización de lanzamiento · Elite League</title><style>body{font:16px system-ui;background:#101611;color:#eee;margin:24px}textarea{display:block;width:100%;height:55vh;margin-bottom:32px;font:12px monospace}</style><h1>Actualización de lanzamiento</h1><p>Proyecto ujsexqffgmkxzyvvholp. Preparación local: nada de esta página se ejecuta automáticamente. No contiene contraseñas ni claves privadas.</p>${parts.map(([label, text]) => `<h2>${label}</h2><textarea readonly aria-label="${label}">${escape(text)}</textarea>`).join('')}</html>`);
console.log('Preparado supabase/.temp/launch-update.html (sin ejecutar ni desplegar).');
