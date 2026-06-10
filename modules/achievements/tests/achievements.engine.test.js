import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDomainEvent, buildSummary, evaluateAchievements } from '../domain/achievements.engine.js';
import { buildMetrics } from '../domain/achievements.scanner.js';

test('evaluateAchievements unlocks tiered metric based achievements', () => {
  const results = evaluateAchievements({
    metrics: {
      tournamentCount: 12,
      tournamentCount2026: 1,
      maxEntriesInTournament: 120,
      totalEntryCount: 840,
      assignedEntryCount: 840,
      completedFieldPlanCount: 2
    },
    events: []
  });
  assert.equal(results.find((item) => item.id === 'competitions.total.10').unlocked, true);
  assert.equal(results.find((item) => item.id === 'competitions.total.25').unlocked, false);
  assert.equal(results.find((item) => item.id === 'entries.perCompetition.100').unlocked, true);
  assert.equal(results.find((item) => item.id === 'annual.competition.2026.1').unlocked, true);
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

test('buildMetrics extracts organizer usage indicators across tournaments', () => {
  const metrics = buildMetrics({
    tournaments: [
      { id: 1, name: 'Demo 2026', dateFrom: '2026-01-10' },
      { id: 2, name: 'Demo 2025', dateFrom: '2025-01-10' }
    ],
    entries: [
      { id: 1, tournamentId: 1, target: '001A', session: 1, division: 'CL', clubCode: 'A' },
      { id: 2, tournamentId: 1, target: '002A', session: 2, division: 'BB', clubCode: 'B' },
      { id: 3, tournamentId: 2, target: '', session: 1, division: 'CO', clubCode: 'C' }
    ],
    scores: [
      { entryId: 1, tournamentId: 1, score: 250, rank: 1 },
      { entryId: 2, tournamentId: 1, score: 0, rank: null }
    ],
    targets: []
  });
  assert.equal(metrics.tournamentCount, 2);
  assert.equal(metrics.tournamentCount2026, 1);
  assert.equal(metrics.totalEntryCount, 3);
  assert.equal(metrics.maxEntriesInTournament, 2);
  assert.equal(metrics.assignedEntryCount, 2);
  assert.equal(metrics.scoredEntryCount, 1);
  assert.equal(metrics.rankedEntryCount, 1);
  assert.equal(metrics.maxSessionCount, 2);
  assert.equal(metrics.maxDivisionCount, 2);
  assert.equal(metrics.maxClubCount, 2);
});
