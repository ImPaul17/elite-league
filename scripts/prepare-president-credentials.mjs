import { randomInt } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLUBS } from '../src/data/league.js';
import { accountIdentifier, validUsername, temporaryPasswordError, TEMPORARY_PASSWORD_CHARACTERS } from '../supabase/functions/_shared/accountRules.js';

// Local preparation only. Credentials must never live in the repository,
// Vite's served root, production assets, logs, SQL, or GitHub Actions.
const requested = process.argv[2];
if (!requested || !isAbsolute(requested)) throw new Error('Indica una carpeta absoluta privada fuera del proyecto.');
const project = fileURLToPath(new URL('../', import.meta.url));
const destination = resolve(requested);
const fromProject = relative(project, destination);
if (!fromProject || (!fromProject.startsWith(`..${sep}`) && fromProject !== '..' && !isAbsolute(fromProject))) {
  throw new Error('Las credenciales no pueden guardarse dentro del proyecto web.');
}

const compact = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const file = resolve(destination, 'cuentas-elite-league-pendientes.json');
const refreshUsernames = process.argv[3] === '--refresh-usernames';
const previous = refreshUsernames ? JSON.parse(await readFile(file, 'utf8')) : null;
if (previous && (previous.status !== 'pending_creation' || previous.accounts.length !== CLUBS.length || previous.accounts.some(account => account.status !== 'pending_creation'))) {
  throw new Error('No se pueden cambiar automáticamente los usuarios de cuentas ya activadas.');
}
const seenUsers = new Set(), seenPasswords = new Set();
const accounts = CLUBS.map(club => {
  const username = `${compact(club.founder.trim().split(/\s+/)[0])}.${compact(club.shortName)}`;
  if (!validUsername(username) || seenUsers.has(username)) throw new Error(`Revisa el usuario de ${club.name}.`);
  seenUsers.add(username);
  let password = previous?.accounts.find(account => account.clubSlug === club.id)?.temporaryPassword;
  if (previous && !password) throw new Error(`Faltan las credenciales pendientes de ${club.name}.`);
  if (!password) do {
    password = `${randomInt(1_000_000).toString().padStart(6, '0')}${TEMPORARY_PASSWORD_CHARACTERS[randomInt(TEMPORARY_PASSWORD_CHARACTERS.length)]}`;
  } while (seenPasswords.has(password));
  if (seenPasswords.has(password)) throw new Error('Las temporales preparadas deben ser distintas.');
  if (temporaryPasswordError(password)) throw new Error('No se pudo generar una temporal válida.');
  seenPasswords.add(password);
  return { clubSlug: club.id, clubName: club.name, displayName: club.founder, username, internalIdentifier: accountIdentifier(username), temporaryPassword: password, globalRole: club.id === 'pico-fc' ? 'admin' : 'member', status: 'pending_creation' };
});

await mkdir(destination, { recursive: true });
await writeFile(file, `${JSON.stringify({ status: 'pending_creation', createdAt: previous?.createdAt || new Date().toISOString(), notice: 'PREPARACIÓN PRIVADA: estas credenciales todavía no corresponden a cuentas creadas. No compartir hasta comprobar su activación. Entregar solo la cuenta propia a cada presidente. No subir a GitHub.', accounts }, null, 2)}\n`, { flag: refreshUsernames ? 'w' : 'wx', mode: 0o600 });
console.log(`Preparadas ${accounts.length} credenciales únicas en ${file}. No se han creado cuentas ni enviado datos a Supabase.`);
