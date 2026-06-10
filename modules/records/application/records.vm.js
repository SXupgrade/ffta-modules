import { loadRecordsDashboard } from './useCases/loadRecordsDashboard.js';
import { saveMonitoredRecord } from './useCases/saveMonitoredRecord.js';
import { importRecords } from './useCases/importRecords.js';
import { checkBrokenRecords } from './useCases/checkBrokenRecords.js';
import { activateTournamentRecords } from './useCases/activateTournamentRecords.js';
import { syncTournamentRecordAreas } from './useCases/syncTournamentRecordAreas.js';
import { saveRecordArea } from './useCases/saveRecordArea.js';
import { deleteRecordArea } from './useCases/deleteRecordArea.js';
import { updateGlobalRecordsFromBroken } from './useCases/updateGlobalRecordsFromBroken.js';
import { saveRecord } from './useCases/saveRecord.js';
import { createRecordsExportDocument, normalizeRecordsForExport, parseRecordsImport } from '../domain/records.import.js';

export function createRecordsViewModel({ app, store, repository }) {
  store.state.__store = store;

  return {
    state: store.state,
    async load() {
      return loadRecordsDashboard({ app, store, repository });
    },
    async saveMonitoredRecord(input) {
      return saveMonitoredRecord({ app, store, repository, input });
    },
    previewImport(text, format = 'auto') {
      const preview = parseRecordsImport(text, { format });
      store.setImportPreview(preview);
      return preview;
    },
    async importPreviewedRecords(options = {}) {
      return importRecords({ app, store, repository, options });
    },
    async activateTournamentRecords(input) {
      return activateTournamentRecords({ app, store, repository, input });
    },
    async syncTournamentRecordAreas(selectedAreaCodes) {
      return syncTournamentRecordAreas({ app, store, repository, selectedAreaCodes });
    },
    async saveRecordArea(input) {
      return saveRecordArea({ app, store, repository, input });
    },
    async saveRecord(input) {
      return saveRecord({ app, store, repository, input });
    },
    async deleteRecordArea(areaCode) {
      return deleteRecordArea({ app, store, repository, areaCode });
    },
    async updateGlobalRecordsFromBroken() {
      return updateGlobalRecordsFromBroken({ app, store, repository });
    },
    async checkBrokenRecords() {
      return checkBrokenRecords({ app, store, repository });
    },
    clearImportPreview() {
      store.setImportPreview(null);
    },
    exportJson() {
      const rows = store.state.globalRecords ?? [];
      app.exports.json('records-global-export.json', createRecordsExportDocument(rows));
    },
    exportCsv() {
      const rows = store.state.globalRecords ?? [];
      app.exports.csv('records-global-export.csv', normalizeRecordsForExport(rows));
    }
  };
}
