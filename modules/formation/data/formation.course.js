export const FORMATION_COURSE = {
  id: 'ffta-ianseo-2024-v1',
  titleKey: 'formation.course.title',
  descriptionKey: 'formation.course.description',
  lessons: [
    { id: 'equipment', titleKey: 'formation.lessons.equipment.title', goalKey: 'formation.lessons.equipment.goal', validators: ['active_tournament'] },
    { id: 'update_resources', titleKey: 'formation.lessons.updateResources.title', goalKey: 'formation.lessons.updateResources.goal', validators: ['active_tournament'] },
    { id: 'create_competition', titleKey: 'formation.lessons.createCompetition.title', goalKey: 'formation.lessons.createCompetition.goal', validators: ['tournament_identity'] },
    { id: 'configure_ffta_18m', titleKey: 'formation.lessons.configureFfta18m.title', goalKey: 'formation.lessons.configureFfta18m.goal', validators: ['french_rule', 'indoor_two_distances'] },
    { id: 'sessions', titleKey: 'formation.lessons.sessions.title', goalKey: 'formation.lessons.sessions.goal', validators: ['sessions_configured'] },
    { id: 'distances_classes', titleKey: 'formation.lessons.distancesClasses.title', goalKey: 'formation.lessons.distancesClasses.goal', validators: ['divisions_classes', 'distances_configured'] },
    { id: 'officials', titleKey: 'formation.lessons.officials.title', goalKey: 'formation.lessons.officials.goal', validators: ['officials_optional'] },
    { id: 'participants', titleKey: 'formation.lessons.participants.title', goalKey: 'formation.lessons.participants.goal', validators: ['participants_created'] },
    { id: 'target_assignment', titleKey: 'formation.lessons.targetAssignment.title', goalKey: 'formation.lessons.targetAssignment.goal', validators: ['targets_assigned'] },
    { id: 'score_sheets', titleKey: 'formation.lessons.scoreSheets.title', goalKey: 'formation.lessons.scoreSheets.goal', validators: ['targets_assigned'] },
    { id: 'score_entry', titleKey: 'formation.lessons.scoreEntry.title', goalKey: 'formation.lessons.scoreEntry.goal', validators: ['scores_entered'] },
    { id: 'ranking_export', titleKey: 'formation.lessons.rankingExport.title', goalKey: 'formation.lessons.rankingExport.goal', validators: ['ranking_ready', 'txt_export_ready'] }
  ]
};
