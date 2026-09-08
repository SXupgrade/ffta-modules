import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function loadScripts() {
  return JSON.parse(readFileSync(new URL('../data/formation.scripts.json', import.meta.url), 'utf8'));
}

function findAction(actions, predicate) {
  return actions.find(predicate);
}

test('tournament identity case starts with a blank name and place', () => {
  const scripts = loadScripts();
  const action = findAction(scripts.initScripts.tournament_identity.actions, (a) => a.type === 'updateTournament');

  assert.equal(action.values.ToCode, 'FFTA-FORM');
  assert.equal(action.values.ToName, '', 'name must start blank so the exercise requires the trainee to fill it in');
  assert.equal(action.values.ToWhere, '', 'place must start blank so the exercise requires the trainee to fill it in');
});

test('FFTA 18m case starts on the wrong rule set and must be corrected', () => {
  const scripts = loadScripts();
  const action = findAction(scripts.initScripts.ffta_18m.actions, (a) => a.type === 'updateTournament');

  assert.equal(action.values.ToLocRule, 'WA', 'must not start on French rules already');
  assert.notEqual(action.values.ToNumDist, 2, 'must not start on the 2-distance Indoor 18m setup already');

  const readyCheck = scripts.checkScripts.ffta_18m_ready.checks;
  assert.ok(readyCheck.some((check) => check.field === 'ToLocRule' && check.value === 'FR'));
});

test('sessions case seeds one unconfigured session that must be completed', () => {
  const scripts = loadScripts();
  const upserts = scripts.initScripts.sessions.actions.filter((a) => a.type === 'upsertSession');

  const configured = upserts.filter((a) => a.values.SesTar4Session > 0 && a.values.SesAth4Target > 0);
  assert.equal(configured.length, 1, 'exactly one session should already be valid so the case is not trivially complete');

  const check = scripts.checkScripts['2_sessions_configured'].checks[0];
  assert.equal(check.expected, 1);
  assert.equal(check.operator, '>');
});

test('participants case seeds archers without an age class', () => {
  const scripts = loadScripts();
  const entries = scripts.initScripts.participants.actions.filter((a) => a.type === 'upsertEntry');

  assert.equal(entries.length, 2);
  for (const entry of entries) {
    assert.equal(entry.values.EnAgeClass, '', `${entry.values.EnCode} must start without an age class`);
    assert.equal(entry.values.EnClass, 'S1', 'base class must match the only division/class seeded by the taxonomy case');
  }

  const checks = scripts.checkScripts.participants_created.checks;
  const ageClassCheck = checks.find((check) => check.where && check.where.EnAgeClass);
  assert.ok(ageClassCheck, 'a dedicated check must require the age class to be filled in');
  assert.equal(ageClassCheck.where.EnAgeClass.operator, '!=');
  assert.equal(ageClassCheck.expected, 2);
});

test('scores case seeds both training archers by their real entry codes', () => {
  const scripts = loadScripts();
  const qualifications = scripts.initScripts.scores.actions.filter((a) => a.type === 'upsertQualification');
  const entryCodes = qualifications.map((a) => a.entryCode);

  assert.deepEqual(entryCodes.sort(), ['1000123A', '1000456Z'].sort(), 'both entry codes must match the ones actually created by the participants case, not a stale FFTA-FORM-00x placeholder');
});

test('wrong target check validates the real corrected position with columns the API can write', () => {
  const scripts = loadScripts();
  const wrongTargetAction = findAction(scripts.initScripts.wrong_target.actions, (a) => a.type === 'upsertQualification');
  const check = scripts.checkScripts.target_case_fixed.checks[0];

  assert.equal(wrongTargetAction.values.QuTarget, '5', 'the seeded wrong target must differ from the expected fixed target');
  assert.equal(check.where['Qualifications.QuTarget'], '2', 'the check must expect the archer back on the target seeded by the participants case');
  assert.notEqual(wrongTargetAction.values.QuTarget, check.where['Qualifications.QuTarget']);
  assert.ok(!('Qualifications.QuPosition' in check.where), 'QuPosition is not a whitelisted Qualifications column in the formation API and must not be used in a check');
});
