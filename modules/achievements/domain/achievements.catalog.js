export const ACHIEVEMENT_CATALOG = expandCatalog([
  {
    id: 'competitions.total',
    category: 'setup',
    titleKey: 'catalog.totalCompetitions.title',
    descriptionKey: 'catalog.totalCompetitions.description',
    metric: 'tournamentCount',
    tiers: [
      { id: 'competitions.total.1', level: 'bronze', tier: 1, target: 1 },
      { id: 'competitions.total.10', level: 'silver', tier: 2, target: 10 },
      { id: 'competitions.total.25', level: 'gold', tier: 3, target: 25 }
    ]
  },
  {
    id: 'annual.competition.2026',
    category: 'annual',
    titleKey: 'catalog.annualCompetition2026.title',
    descriptionKey: 'catalog.annualCompetition2026.description',
    metric: 'tournamentCount2026',
    tiers: [{ id: 'annual.competition.2026.1', level: 'bronze', tier: 1, target: 1 }]
  },
  {
    id: 'entries.perCompetition',
    category: 'registration',
    titleKey: 'catalog.entriesPerCompetition.title',
    descriptionKey: 'catalog.entriesPerCompetition.description',
    metric: 'maxEntriesInTournament',
    tiers: [
      { id: 'entries.perCompetition.10', level: 'bronze', tier: 1, target: 10 },
      { id: 'entries.perCompetition.50', level: 'silver', tier: 2, target: 50 },
      { id: 'entries.perCompetition.100', level: 'gold', tier: 3, target: 100 }
    ]
  },
  {
    id: 'entries.total',
    category: 'registration',
    titleKey: 'catalog.totalEntries.title',
    descriptionKey: 'catalog.totalEntries.description',
    metric: 'totalEntryCount',
    tiers: [
      { id: 'entries.total.100', level: 'bronze', tier: 1, target: 100 },
      { id: 'entries.total.500', level: 'silver', tier: 2, target: 500 },
      { id: 'entries.total.1000', level: 'gold', tier: 3, target: 1000 }
    ]
  },
  {
    id: 'assigned.total',
    category: 'field',
    titleKey: 'catalog.assignedTotal.title',
    descriptionKey: 'catalog.assignedTotal.description',
    metric: 'assignedEntryCount',
    tiers: [
      { id: 'assigned.total.1', level: 'bronze', tier: 1, target: 1 },
      { id: 'assigned.total.100', level: 'silver', tier: 2, target: 100 },
      { id: 'assigned.total.500', level: 'gold', tier: 3, target: 500 }
    ]
  },
  {
    id: 'field.plan.complete',
    category: 'field',
    level: 'silver',
    titleKey: 'catalog.fieldPlanComplete.title',
    descriptionKey: 'catalog.fieldPlanComplete.description',
    metric: 'completedFieldPlanCount',
    target: 1
  },
  {
    id: 'scores.total',
    category: 'results',
    titleKey: 'catalog.scoresTotal.title',
    descriptionKey: 'catalog.scoresTotal.description',
    metric: 'scoredEntryCount',
    tiers: [
      { id: 'scores.total.1', level: 'bronze', tier: 1, target: 1 },
      { id: 'scores.total.100', level: 'silver', tier: 2, target: 100 },
      { id: 'scores.total.500', level: 'gold', tier: 3, target: 500 }
    ]
  },
  {
    id: 'multi.session',
    category: 'setup',
    level: 'silver',
    titleKey: 'catalog.multiSession.title',
    descriptionKey: 'catalog.multiSession.description',
    metric: 'multiSessionTournamentCount',
    target: 1
  },
  {
    id: 'all.divisions',
    category: 'competition',
    level: 'gold',
    titleKey: 'catalog.allDivisions.title',
    descriptionKey: 'catalog.allDivisions.description',
    metric: 'maxDivisionCount',
    target: 3
  },
  {
    id: 'different.club.count',
    category: 'registration',
    titleKey: 'catalog.clubCount.title',
    descriptionKey: 'catalog.clubCount.description',
    metric: 'maxClubCount',
    tiers: [
      { id: 'different.club.count.5', level: 'bronze', tier: 1, target: 5 },
      { id: 'different.club.count.15', level: 'silver', tier: 2, target: 15 },
      { id: 'different.club.count.30', level: 'gold', tier: 3, target: 30 }
    ]
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
  },
  {
    id: 'restore.completed',
    category: 'safety',
    level: 'silver',
    titleKey: 'catalog.restoreCompleted.title',
    descriptionKey: 'catalog.restoreCompleted.description',
    eventType: 'backup.restored',
    target: 1
  },
  {
    id: 'mobile.scoring',
    category: 'mobile',
    level: 'gold',
    titleKey: 'catalog.mobileScoring.title',
    descriptionKey: 'catalog.mobileScoring.description',
    eventType: 'mobile.scoring.enabled',
    target: 1
  },
  {
    id: 'sponsors.configured',
    category: 'live',
    level: 'silver',
    titleKey: 'catalog.sponsorsConfigured.title',
    descriptionKey: 'catalog.sponsorsConfigured.description',
    eventType: 'sponsors.configured',
    target: 1
  }
]);

export function getCategories(catalog = ACHIEVEMENT_CATALOG) {
  return Array.from(new Set(catalog.map((item) => item.category)));
}

function expandCatalog(items) {
  return items.flatMap((item) => {
    if (!Array.isArray(item.tiers) || !item.tiers.length) return [item];
    return item.tiers.map((tier) => ({
      ...item,
      ...tier,
      groupId: item.id,
      tiers: undefined,
      isTiered: true
    }));
  });
}
