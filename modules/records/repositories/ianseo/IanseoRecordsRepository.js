export function createIanseoRecordsRepository({ app }) {
  const options = { moduleId: 'records' };

  return {
    getRecordsDashboard: () => app.data.records.getDashboard(options),
    saveRecordArea: (input) => app.data.records.saveRecordArea(input, options),
    deleteRecordArea: (input) => app.data.records.deleteRecordArea(input, options),
    syncTournamentRecordAreas: (payload) => app.data.records.syncTournamentRecordAreas(payload, options),
    updateGlobalRecordsFromBroken: () => app.data.records.updateGlobalRecordsFromBroken(options),
    saveMonitoredRecord: (input) => app.data.records.saveMonitoredRecord(input, options),
    saveRecord: (payload) => app.data.records.saveRecord(payload, options),
    importRecords: (payload) => app.data.records.importRecords(payload, options),
    activateTournamentRecords: (payload) => app.data.records.activateTournamentRecords(payload, options),
    checkBrokenRecords: () => app.data.records.checkBrokenRecords(options)
  };
}
