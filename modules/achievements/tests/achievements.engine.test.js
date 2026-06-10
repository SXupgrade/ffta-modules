import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDomainEvent, buildSummary, evaluateAchievements } from '../domain/achievements.engine.js';
import { buildMetrics } from '../domain/achievements.scanner.js';

test('evaluateAchievements unlocks metric based achievements', () => {
  const results = evaluateAchievements({
    metrics: { tournamentCount: 1, entryCount: 120, assignedEntryCount: 120, fieldCompletionPercent: 100 },
    events: []
  });
  assert.equal(results.find((item) => item.id === 'competition.loaded').unlocked, true);
  assert.equal(results.find((item) => item.id === 'big.competition.100').unlocked, true);
  assert.equal(results.find((item) => item.id === 'field.plan.complete').progress, 100);
});

test('evaluateAchievements unlocks event based achievements', () => {
  const events = applyDomainEvent([], { type: 'record.broken', occurredAt: '2026-06-09T10:00:00Z' });
  const results = evaluateAchievements({ metrics: {}, events });
  const record = results.find((item) => item.id === 'record.witnessed');
  assert.equal(record.unlocked, true);
  assert.equal(record.unlockedAt, '2026-06-09T10:00:00Z');
});

test('buildSummary counts unlocked achievements', () => {
  const results = evaluateAchievements({ metrics: { tournamentCount: 1 }, events: [] });
  const summary = buildSummary(results);
  assert.equal(summary.total > 0, true);
  assert.equal(summary.unlocked >= 1, true);
  assert.equal(summary.byCategory.setup.total >= 1, true);
});

test('buildMetrics extracts organizer usage indicators', () => {
  const metrics = buildMetrics({
    tournament: { name: 'Demo' },
    entries: [
      { id: 1, target: '001A', session: 1, division: 'CL' },
      { id: 2, target: '', session: 2, division: 'BB' }
    ],
    scores: [
      { entryId: 1, score: 250, rank: 1 },
      { entryId: 2, score: 0, rank: null }
    ],
    targets: []
  });
  assert.equal(metrics.tournamentCount, 1);
  assert.equal(metrics.entryCount, 2);
  assert.equal(metrics.assignedEntryCount, 1);
  assert.equal(metrics.scoredEntryCount, 1);
  assert.equal(metrics.rankedEntryCount, 1);
  assert.equal(metrics.sessionCount, 2);
});
