export async function saveLeagueSettings({ app, store, repository, settings }) {
  await repository.saveSettings(settings);
  store.setSettings(settings);
  app.notify.success(app.t('league.messages.settingsSaved'));
}
