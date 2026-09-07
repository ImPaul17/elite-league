import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculatePlayerStatistics, calculateStandings, getMatchStatus, getOfficialMatchEvents, getScoreLabel, withoutMatchResult } from "./leagueEngine.js";

const clubs = [{ id: "home", name: "Local" }, { id: "away", name: "Visitante" }];
const fixture = {
  id: "match-1", databaseId: "uuid-1", matchdayId: "j1", order: 2,
  homeClubId: "home", awayClubId: "away", status: "confirmed",
  score: { home: 2, away: 2 }, penalties: { home: 4, away: 3 },
  resultPublishedAt: "2026-09-06T12:00:00Z", kickoff: "2026-09-06T11:00:00Z",
  lineupDeadline: "2026-09-06T10:00:00Z",
};

test("borrar el resultado conserva el partido y sus fechas y quita marcador, penaltis y publicación", () => {
  const cleared = withoutMatchResult(fixture);
  assert.deepEqual(cleared, { ...fixture, status: "scheduled", score: null, penalties: null, resultPublishedAt: null });
  assert.equal(getMatchStatus(cleared).label, "Por jugar");
  assert.equal(getScoreLabel(cleared), "VS");
  assert.equal(fixture.status, "confirmed");
  assert.deepEqual(fixture.penalties, { home: 4, away: 3 });
  assert.deepEqual(withoutMatchResult(cleared), cleared);
});

test("la clasificación deja de contar el resultado borrado y admite publicarlo otra vez", () => {
  const cleared = withoutMatchResult(fixture);
  assert.deepEqual(calculateStandings(clubs, [fixture]).map((row) => row.points), [2, 1]);
  for (const row of calculateStandings(clubs, [cleared])) {
    for (const key of ["played", "wins", "losses", "penaltyWins", "penaltyLosses", "goalsFor", "goalsAgainst", "goalDifference", "points"]) {
      assert.equal(row[key], 0, key);
    }
    assert.deepEqual(row.form, []);
  }
  const republished = { ...cleared, status: "confirmed", score: { home: 0, away: 1 } };
  assert.deepEqual(calculateStandings(clubs, [republished]).map((row) => [row.club.id, row.points]), [["away", 3], ["home", 0]]);
});

test("los eventos se conservan pero no cuentan en estadísticas hasta volver a confirmar el partido", () => {
  const events = [{ matchId: fixture.id, playerId: "p1", eventType: "goal" }, { matchId: "unknown", playerId: "p1", eventType: "goal" }];
  const players = [{ id: "p1", clubId: "home", name: "Jugador" }];
  assert.equal(calculatePlayerStatistics(players, getOfficialMatchEvents(events, [fixture]))[0].goals, 1);
  assert.equal(calculatePlayerStatistics(players, getOfficialMatchEvents(events, [withoutMatchResult(fixture)]))[0].goals, 0);
  assert.equal(events.length, 2);
  assert.equal(getOfficialMatchEvents(events, [fixture]).length, 1);
});

test("la migración limita el borrado al resultado elegido con permiso administrativo y auditoría transaccional", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/0004_clear_match_result.sql", import.meta.url), "utf8");
  assert.match(sql, /begin;/);
  assert.match(sql, /if not public\.is_admin\(\) then/);
  assert.match(sql, /delete from public\.match_results where match_id = p_match_id returning \* into previous_result/);
  const beforeDelete = sql.slice(0, sql.indexOf("delete from public.match_results"));
  assert.doesNotMatch(beforeDelete, /for\s+update/i, "no bloquea el partido antes del resultado: respeta el orden de confirm_match_result");
  assert.match(sql, /update public\.matches set status = 'scheduled' where id = p_match_id/);
  assert.match(sql, /insert into public\.audit_logs[\s\S]*before_data[\s\S]*to_jsonb\(previous_result\)/);
  assert.match(sql, /revoke execute on function public\.clear_match_result\(uuid\) from public, anon/);
  assert.match(sql, /grant execute on function public\.clear_match_result\(uuid\) to authenticated/);
  assert.match(sql, /commit;/);
  assert.doesNotMatch(sql, /delete from public\.(?:matches|match_events|lineup_submissions|lineup_slots)\b/);
});

test("el editor pide una segunda acción explícita y no confunde borrar con publicar un 0–0", async () => {
  const source = await readFile(new URL("../components/operations.jsx", import.meta.url), "utf8");
  const editor = source.slice(source.indexOf("export function ResultEditor"), source.indexOf("export function PlayerRegistrationForm"));
  assert.match(editor, /if \(busyRef\.current \|\| !confirmClear \|\| !match\.score \|\| !canEdit\) return/);
  assert.match(editor, /clearMatchResult\(\{ matchId: match\.id \}\)/);
  assert.match(editor, /type="button" onClick=\{clearResult\}/);
  assert.match(editor, /Confirmar borrado/);
  assert.match(editor, /Cancelar/);
  assert.match(editor, /viewer\.source !== "preview"/);
  assert.match(editor, /!viewer\.requiresPasswordChange/);
});
