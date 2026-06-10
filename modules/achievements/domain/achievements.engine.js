import { ACHIEVEMENT_CATALOG } from './achievements.catalog.js';

export function evaluateAchievements({ metrics = {}, events = [], catalog = ACHIEVEMENT_CATALOG } = {}) {
  const eventCounts = countEvents(events);
  return catalog.map((achievement) => {
    const current = achievement.metric
      ? normalizeMetric(metrics[achievement.metric])
      : normalizeMetric(eventCounts[achievement.eventType]);
    const target = Math.max(1, Number(achievement.target || 1));
    const progress = Math.min(100, Math.round((current / target) * 100));
    const unlocked = current >= target;
    return {
      ...achievement,
      current,
      target,
      progress,
      unlocked,
      unlockedAt: unlocked ? resolveUnlockedAt(achievement, metrics, events) : null
    };
  });
}

export function buildSummary(evaluatedAchievements = []) {
  const total = evaluatedAchievements.length;
  const unlocked = evaluatedAchievements.filter((achievement) => achievement.unlocked).length;
  const percent = total ? Math.round((unlocked / total) * 100) : 0;
  const byCategory = {};

  for (const achievement of evaluatedAchievements) {
    if (!byCategory[achievement.category]) {
      byCategory[achievement.category] = { total: 0, unlocked: 0 };
    }
    byCategory[achievement.category].total += 1;
    if (achievement.unlocked) byCategory[achievement.category].unlocked += 1;
  }

  return { total, unlocked, locked: total - unlocked, percent, byCategory };
}

export function applyDomainEvent(previousEvents = [], event = {}) {
  if (!event.type) throw new Error('Achievement event type is required.');
  const normalized = {
    id: event.id || `${event.type}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
    type: String(event.type),
    payload: event.payload || {},
    occurredAt: event.occurredAt || new Date().toISOString()
  };
  return [...previousEvents, normalized];
}

function countEvents(events) {
  return events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
}

function normalizeMetric(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function resolveUnlockedAt(achievement, metrics, events) {
  if (achievement.metric) return metrics.scannedAt || null;
  const event = events.find((item) => item.type === achievement.eventType);
  return event?.occurredAt || null;
}
