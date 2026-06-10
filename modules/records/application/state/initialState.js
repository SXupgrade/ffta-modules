export function createInitialRecordsState() {
  return {
    isLoading: false,
    isSaving: false,
    error: null,
    tournament: null,
    areas: [],
    monitoredRecords: [],
    recordCodes: [],
    globalRecords: [],
    records: [],
    brokenRecords: [],
    importPreview: null,
    selectedAreaCode: 'FFTA',
    selectedTeam: 0,
    selectedPara: 0,
    selectedHeaderCode: '',
    selectedHeader: '',
    warnings: [],
    updatedAt: null
  };
}
