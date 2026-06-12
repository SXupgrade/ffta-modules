export const ASSISTANT_PHASES = [
  { id: 'before', order: 10, offsetDays: -30 },
  { id: 'during', order: 20, offsetDays: 0 },
  { id: 'after', order: 30, offsetDays: 1 }
];

export const ASSISTANT_ITEMS = [
  {
    id: 'tournament.identity.confirmed', phase: 'before', timing: 'J-30', priority: 'mandatory', checkKey: 'hasTournamentIdentity',
    titleKey: 'items.tournament.identity.title', descriptionKey: 'items.tournament.identity.description', tooltipKey: 'items.tournament.identity.tooltip'
  },
  {
    id: 'judge.responsible.declared', phase: 'before', timing: 'J-30', priority: 'mandatory', checkKey: 'hasResponsibleJudge',
    titleKey: 'items.judge.responsible.title', descriptionKey: 'items.judge.responsible.description', tooltipKey: 'items.judge.responsible.tooltip'
  },
  {
    id: 'target.faces.ordered', phase: 'before', timing: 'J-20', priority: 'mandatory',
    titleKey: 'items.target.faces.title', descriptionKey: 'items.target.faces.description', tooltipKey: 'items.target.faces.tooltip'
  },
  {
    id: 'awards.ordered', phase: 'before', timing: 'J-15', priority: 'optional',
    titleKey: 'items.awards.title', descriptionKey: 'items.awards.description', tooltipKey: 'items.awards.tooltip'
  },
  {
    id: 'entries.imported', phase: 'before', timing: 'J-10', priority: 'mandatory', checkKey: 'hasEntries',
    titleKey: 'items.entries.imported.title', descriptionKey: 'items.entries.imported.description', tooltipKey: 'items.entries.imported.tooltip'
  },
  {
    id: 'field.assigned', phase: 'before', timing: 'J-5', priority: 'mandatory', checkKey: 'allArchersAssigned',
    titleKey: 'items.field.assigned.title', descriptionKey: 'items.field.assigned.description', tooltipKey: 'items.field.assigned.tooltip'
  },
  {
    linkModuleId: 'prints-adapter', id: 'scorecards.printed', phase: 'before', timing: 'J-2', priority: 'mandatory', eventType: 'pdf.scorecards.printed',
    titleKey: 'items.scorecards.title', descriptionKey: 'items.scorecards.description', tooltipKey: 'items.scorecards.tooltip'
  },
  {
    id: 'chronotir.charged', phase: 'before', timing: 'J-1', priority: 'optional',
    titleKey: 'items.chronotir.title', descriptionKey: 'items.chronotir.description', tooltipKey: 'items.chronotir.tooltip'
  },
  {
    id: 'backup.created', phase: 'before', timing: 'J-1', priority: 'mandatory', eventType: 'backup.created',
    titleKey: 'items.backup.title', descriptionKey: 'items.backup.description', tooltipKey: 'items.backup.tooltip'
  },
  {
    id: 'field.installed', phase: 'during', timing: 'H-2', priority: 'mandatory',
    titleKey: 'items.field.installed.title', descriptionKey: 'items.field.installed.description', tooltipKey: 'items.field.installed.tooltip'
  },
  {
    id: 'targets.faced', phase: 'during', timing: 'H-1', priority: 'mandatory',
    titleKey: 'items.targets.faced.title', descriptionKey: 'items.targets.faced.description', tooltipKey: 'items.targets.faced.tooltip'
  },
  {
    id: 'greffe.ready', phase: 'during', timing: 'H-1', priority: 'mandatory',
    titleKey: 'items.greffe.title', descriptionKey: 'items.greffe.description', tooltipKey: 'items.greffe.tooltip'
  },
  {
    id: 'qualification.scored', phase: 'during', timing: 'Live', priority: 'mandatory', checkKey: 'hasQualificationScores',
    titleKey: 'items.qualification.scored.title', descriptionKey: 'items.qualification.scored.description', tooltipKey: 'items.qualification.scored.tooltip'
  },
  {
    id: 'live.published', phase: 'during', timing: 'Live', priority: 'optional', eventType: 'live.enabled',
    titleKey: 'items.live.title', descriptionKey: 'items.live.description', tooltipKey: 'items.live.tooltip'
  },
  {
    id: 'results.checked', phase: 'after', timing: 'J+0', priority: 'mandatory', checkKey: 'hasRankedScores',
    titleKey: 'items.results.checked.title', descriptionKey: 'items.results.checked.description', tooltipKey: 'items.results.checked.tooltip'
  },
  {
    linkModuleId: 'export-ffta', id: 'ffta.export.generated', phase: 'after', timing: 'J+0', priority: 'mandatory', eventType: 'export.federal.generated',
    titleKey: 'items.ffta.export.title', descriptionKey: 'items.ffta.export.description', tooltipKey: 'items.ffta.export.tooltip'
  },
  {
    linkModuleId: 'records', id: 'records.checked', phase: 'after', timing: 'J+1', priority: 'optional', eventType: 'record.checked',
    titleKey: 'items.records.title', descriptionKey: 'items.records.description', tooltipKey: 'items.records.tooltip'
  },
  {
    id: 'archive.completed', phase: 'after', timing: 'J+7', priority: 'optional',
    titleKey: 'items.archive.title', descriptionKey: 'items.archive.description', tooltipKey: 'items.archive.tooltip'
  }
];

export function getItemsByPhase(items = ASSISTANT_ITEMS) {
  return ASSISTANT_PHASES.map((phase) => ({ ...phase, items: items.filter((item) => item.phase === phase.id) }));
}
