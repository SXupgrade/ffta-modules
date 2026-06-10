import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateChecklist, buildSummary, applyDomainEvent } from '../domain/assistant.engine.js';
import { buildMetrics } from '../domain/assistant.scanner.js';

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
