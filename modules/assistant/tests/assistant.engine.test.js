import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateChecklist, buildSummary, applyDomainEvent } from '../domain/assistant.engine.js';
import { buildMetrics, scanAssistantMetrics } from '../domain/assistant.scanner.js';

test('assistant checklist marks automatic checks from tournament metrics', () => {
  const metrics = buildMetrics({
    tournament: { ToName: 'Test tournament' },
    entries: [
      { EnTournament: 1, quTargetNo: '001A' },
      { EnTournament: 1, quTargetNo: '001B' }
    ],
    scores: [{ QuScore: 560, QuClRank: 1 }],
    officials: [{ role: 'Responsible judge' }]
  });
  const items = evaluateChecklist({ metrics });

  assert.equal(items.find((item) => item.id === 'judge.responsible.declared').status, 'auto');
  assert.equal(items.find((item) => item.id === 'field.assigned').status, 'auto');
  assert.equal(items.find((item) => item.id === 'qualification.scored').status, 'auto');
  assert.equal(items.find((item) => item.id === 'results.checked').status, 'auto');
});

test('assistant checklist respects manual done and N/A statuses', () => {
  const items = evaluateChecklist({ statuses: { 'target.faces.ordered': 'done', 'awards.ordered': 'na' } });
  assert.equal(items.find((item) => item.id === 'target.faces.ordered').isDone, true);
  assert.equal(items.find((item) => item.id === 'awards.ordered').status, 'na');
});

test('assistant events can unlock event driven items', () => {
  const events = applyDomainEvent([], { type: 'export.federal.generated', occurredAt: '2026-01-01T00:00:00Z' });
  const items = evaluateChecklist({ events });
  assert.equal(items.find((item) => item.id === 'ffta.export.generated').status, 'auto');
});

test('assistant summary counts mandatory progress', () => {
  const items = evaluateChecklist({ statuses: { 'target.faces.ordered': 'done' } });
  const summary = buildSummary(items);
  assert.equal(summary.total > 0, true);
  assert.equal(summary.mandatory > 0, true);
  assert.equal(summary.done >= 1, true);
});

test('assistant checklist includes the pitfall warnings surfaced from organizer feedback', () => {
  const items = evaluateChecklist();
  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  assert.equal(byId['rules.trio.locked'].phase, 'before');
  assert.equal(byId['rules.trio.locked'].priority, 'mandatory');
  assert.equal(byId['rules.trio.locked'].warningKey, 'items.rules.trio.warning');

  assert.equal(byId['organizer.code.verified'].warningKey, 'items.organizer.code.warning');
  assert.equal(byId['entries.flags.checked'].warningKey, 'items.entries.flags.warning');
  assert.equal(byId['archers.database.refreshed'].warningKey, 'items.archers.database.refreshed.warning');
  assert.equal(byId['results.classement.typeChecked'].phase, 'after');
  assert.equal(byId['field.assigned'].warningKey, 'items.field.assigned.warning');

  assert.equal(byId['archers.database.imported'].phase, 'before');
  assert.equal(byId['flags.clubs.downloaded'].priority, 'optional');
});

test('responsible judge auto-check degrades to 0 if data.officials is absent', async () => {
  // Defensive case: an adapter/context that predates the `officials` accessor (or a
  // read-restricted ACL profile that hides it) must not throw or report a wrong count.
  const data = {
    request: async () => { throw new Error('Unknown lab data action: scanTournamentAssistant'); },
    tournament: { getCurrent: async () => ({ name: 'Test tournament' }) },
    entries: { list: async () => [{ target: '001A' }] },
    scores: { readQualificationScores: async () => [{ score: 560, rank: 1 }] }
  };

  const metrics = await scanAssistantMetrics({ data });

  assert.equal(metrics.responsibleJudgeCount, 0);
  assert.equal(metrics.tournamentName, 'Test tournament', 'the fields with a real accessor must still resolve');
});

test('responsible judge auto-check detects a judge through data.officials.list', async () => {
  const data = {
    request: async () => { throw new Error('Unknown lab data action: scanTournamentAssistant'); },
    tournament: { getCurrent: async () => ({ name: 'Test tournament' }) },
    entries: { list: async () => [] },
    scores: { readQualificationScores: async () => [] },
    officials: { list: async () => [{ role: 'Responsible judge' }] }
  };

  const metrics = await scanAssistantMetrics({ data });

  assert.equal(metrics.responsibleJudgeCount, 1);
});

test('the real createDataService officials.list accessor reaches the adapter and resolves through scanAssistantMetrics', async () => {
  const { createDataService } = await import('../../../core/module-api/services/data.service.js');
  const calls = [];
  const adapter = {
    async request(action) {
      calls.push(action);
      if (action === 'getCurrentTournament') return { name: 'Adapter tournament' };
      if (action === 'listEntries') return [];
      if (action === 'readQualificationScores') return [];
      if (action === 'listOfficials') return [{ name: 'A. Dupont', role: 'Responsible Judge' }];
      throw new Error(`Unexpected action: ${action}`);
    }
  };
  const data = createDataService(adapter);

  const metrics = await scanAssistantMetrics({ data });

  assert.ok(calls.includes('listOfficials'), 'data.officials.list() must call the adapter with the listOfficials action');
  assert.equal(metrics.responsibleJudgeCount, 1);
  assert.equal(metrics.tournamentName, 'Adapter tournament');
});
