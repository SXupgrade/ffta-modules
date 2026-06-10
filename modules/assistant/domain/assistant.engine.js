import { ASSISTANT_ITEMS } from './assistant.catalog.js';

export const STATUS = Object.freeze({ TODO: 'todo', DONE: 'done', NA: 'na', AUTO: 'auto' });

export function evaluateChecklist({ items = ASSISTANT_ITEMS, statuses = {}, metrics = {}, events = [] } = {}) {
  const eventTypes = new Set((events || []).map((event) => event.type));
  return items.map((item) => {
    const manualStatus = statuses[item.id];
    const autoPassed = evaluateAutoCheck(item, metrics, eventTypes);
    const status = manualStatus || (autoPassed ? STATUS.AUTO : STATUS.TODO);
    return {
      ...item,
      status,
      isDone: status === STATUS.DONE || status === STATUS.NA || status === STATUS.AUTO,
      isAutomatic: status === STATUS.AUTO,
      autoPassed
    };
  });
}

export function buildSummary(items = []) {
  const mandatoryItems = items.filter((item) => item.priority === 'mandatory');
  const doneItems = items.filter((item) => item.isDone);
  const mandatoryDone = mandatoryItems.filter((item) => item.isDone);
  const percent = items.length ? Math.round((doneItems.length / items.length) * 100) : 0;
  const mandatoryPercent = mandatoryItems.length ? Math.round((mandatoryDone.length / mandatoryItems.length) * 100) : 0;
  return {
    total: items.length,
    done: doneItems.length,
    mandatory: mandatoryItems.length,
    mandatoryDone: mandatoryDone.length,
    percent,
    mandatoryPercent,
    remainingMandatory: mandatoryItems.length - mandatoryDone.length
  };
}

export function applyDomainEvent(events = [], event = {}) {
  if (!event.type) return events;
  return [...events, { type: event.type, occurredAt: event.occurredAt || new Date().toISOString() }];
}

export function evaluateAutoCheck(item, metrics = {}, eventTypes = new Set()) {
  if (item.eventType && eventTypes.has(item.eventType)) return true;

  switch (item.checkKey) {
    case 'hasTournamentIdentity': return Boolean(metrics.tournamentName || metrics.tournamentCode);
    case 'hasResponsibleJudge': return Number(metrics.responsibleJudgeCount || 0) >= 1;
    case 'hasEntries': return Number(metrics.entryCount || metrics.totalEntryCount || 0) >= 1;
    case 'allArchersAssigned': {
      const entries = Number(metrics.entryCount || metrics.totalEntryCount || 0);
      if (!entries) return false;
      return Number(metrics.assignedEntryCount || 0) >= entries;
    }
    case 'hasQualificationScores': return Number(metrics.scoredEntryCount || 0) >= 1;
    case 'hasRankedScores': return Number(metrics.rankedEntryCount || 0) >= 1;
    default: return false;
  }
}
