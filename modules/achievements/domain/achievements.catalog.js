export const ACHIEVEMENT_CATALOG = [
  {
    id: 'competition.loaded',
    category: 'setup',
    level: 'bronze',
    titleKey: 'catalog.competitionLoaded.title',
    descriptionKey: 'catalog.competitionLoaded.description',
    metric: 'tournamentCount',
    target: 1
  },
  {
    id: 'entries.imported',
    category: 'registration',
    level: 'bronze',
    titleKey: 'catalog.entriesImported.title',
    descriptionKey: 'catalog.entriesImported.description',
    metric: 'entryCount',
    target: 1
  },
  {
    id: 'big.competition.100',
    category: 'registration',
    level: 'silver',
    titleKey: 'catalog.bigCompetition100.title',
    descriptionKey: 'catalog.bigCompetition100.description',
    metric: 'entryCount',
    target: 100
  },
  {
    id: 'targets.assigned',
    category: 'field',
    level: 'bronze',
    titleKey: 'catalog.targetsAssigned.title',
    descriptionKey: 'catalog.targetsAssigned.description',
    metric: 'assignedEntryCount',
    target: 1
  },
  {
    id: 'field.plan.complete',
    category: 'field',
    level: 'silver',
    titleKey: 'catalog.fieldPlanComplete.title',
    descriptionKey: 'catalog.fieldPlanComplete.description',
    metric: 'fieldCompletionPercent',
    target: 100
  },
  {
    id: 'scores.entered',
    category: 'results',
    level: 'bronze',
    titleKey: 'catalog.scoresEntered.title',
    descriptionKey: 'catalog.scoresEntered.description',
    metric: 'scoredEntryCount',
    target: 1
  },
  {
    id: 'ranking.ready',
    category: 'results',
    level: 'silver',
    titleKey: 'catalog.rankingReady.title',
    descriptionKey: 'catalog.rankingReady.description',
    metric: 'rankedEntryCount',
    target: 1
  },
  {
    id: 'multi.session',
    category: 'setup',
    level: 'silver',
    titleKey: 'catalog.multiSession.title',
    descriptionKey: 'catalog.multiSession.description',
    metric: 'sessionCount',
    target: 2
  },
  {
    id: 'all.divisions',
    category: 'competition',
    level: 'gold',
    titleKey: 'catalog.allDivisions.title',
    descriptionKey: 'catalog.allDivisions.description',
    metric: 'divisionCount',
    target: 3
  },
  {
    id: 'export.federal',
    category: 'exports',
    level: 'bronze',
    titleKey: 'catalog.exportFederal.title',
    descriptionKey: 'catalog.exportFederal.description',
    eventType: 'export.federal.generated',
    target: 1
  },
  {
    id: 'pdf.generated',
    category: 'exports',
    level: 'bronze',
    titleKey: 'catalog.pdfGenerated.title',
    descriptionKey: 'catalog.pdfGenerated.description',
    eventType: 'pdf.generated',
    target: 1
  },
  {
    id: 'record.witnessed',
    category: 'records',
    level: 'gold',
    titleKey: 'catalog.recordWitnessed.title',
    descriptionKey: 'catalog.recordWitnessed.description',
    eventType: 'record.broken',
    target: 1
  },
  {
    id: 'finals.individual',
    category: 'finals',
    level: 'silver',
    titleKey: 'catalog.individualFinals.title',
    descriptionKey: 'catalog.individualFinals.description',
    eventType: 'finals.individual.started',
    target: 1
  },
  {
    id: 'finals.team',
    category: 'finals',
    level: 'gold',
    titleKey: 'catalog.teamFinals.title',
    descriptionKey: 'catalog.teamFinals.description',
    eventType: 'finals.team.started',
    target: 1
  },
  {
    id: 'live.enabled',
    category: 'live',
    level: 'gold',
    titleKey: 'catalog.liveEnabled.title',
    descriptionKey: 'catalog.liveEnabled.description',
    eventType: 'live.enabled',
    target: 1
  },
  {
    id: 'backup.created',
    category: 'safety',
    level: 'bronze',
    titleKey: 'catalog.backupCreated.title',
    descriptionKey: 'catalog.backupCreated.description',
    eventType: 'backup.created',
    target: 1
  }
];

export function getCategories(catalog = ACHIEVEMENT_CATALOG) {
  return Array.from(new Set(catalog.map((item) => item.category)));
}
