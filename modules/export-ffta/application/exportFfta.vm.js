import { generateDatasetExport } from '../domain/exportFfta.datasetEngine.js';
import { compareText } from '../domain/tnr.comparator.js';

export function createExportFftaViewModel({ app, store }) {
  const moduleBaseUrl = new URL('../', import.meta.url).href;
  const apiUrl = new URL('./api/export-ffta.php', moduleBaseUrl).href;
  const isLabRuntime = Boolean(app.runtime?.isLab);

  async function load() {
    store.set({ status: 'idle', error: null });
  }

  function setTab(activeTab) { store.set({ activeTab, report: null, error: null }); }
  function setLevel(level) { store.set({ level, expectedFile: `active-${level}.txt` }); }
  function setExpectedFile(expectedFile) { store.set({ expectedFile }); }
  function setDatasetFile(datasetFile) { store.set({ datasetFile }); }

  function getDownloadUrl() {
    const level = encodeURIComponent(store.state.level || 'S');
    return `${apiUrl}?action=download&level=${level}`;
  }

  async function downloadActiveExport() {
    const level = store.state.level || 'S';

    if (!isLabRuntime) {
      window.location.href = getDownloadUrl();
      return;
    }

    store.set({ isLoading: true, status: 'running', error: null });
    try {
      const tournament = await app.context.getTournament();
      const entries = await app.data.entries.list({}, { moduleId: 'export-ffta', permission: 'read' });
      const scores = await app.data.scores.listQualificationScores({}, { moduleId: 'export-ffta', permission: 'read' });
      const entriesById = new Map(entries.map((entry) => [String(entry.id), entry]));
      const dataset = {
        version: 'LAB-MOCK-1',
        level,
        tournament: { code: tournament?.code || 'LAB' },
        results: scores.map((score) => {
          const entry = entriesById.get(String(score.entryId)) || {};
          return {
            license: entry.code || score.license || score.entryId || '',
            lastName: entry.lastName || splitScoreName(score.name).lastName,
            firstName: entry.firstName || splitScoreName(score.name).firstName,
            clubCode: entry.clubCode || '',
            division: entry.division || score.division || '',
            classCode: entry.class || score.class || '',
            score: score.score || 0,
            rank: score.rank || ''
          };
        })
      };
      const content = generateDatasetExport(dataset);
      app.files.downloadText(`lab-export-${level}.txt`, content);
      store.set({ isLoading: false, status: 'success' });
    } catch (error) {
      store.set({ isLoading: false, status: 'failure', error: error.message });
      app.notify.error(error.message);
    }
  }

  async function runActiveTnr() {
    store.set({ isLoading: true, status: 'running', error: null, report: null });
    try {
      const params = new URLSearchParams({ action: 'tnrActive', level: store.state.level, expected: store.state.expectedFile });
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error || 'TNR failed');
      store.set({ isLoading: false, status: payload.report.success ? 'success' : (payload.report.missingExpected ? 'missingExpected' : 'failure'), report: payload.report });
    } catch (error) {
      store.set({ isLoading: false, status: 'failure', error: error.message });
    }
  }

  async function runDatasetTnr() {
    store.set({ isLoading: true, status: 'running', error: null, report: null });
    try {
      const datasetResponse = await fetch(new URL(`./tests/datasets/${encodeURIComponent(store.state.datasetFile)}`, moduleBaseUrl).href);
      const dataset = await datasetResponse.json();
      const generated = generateDatasetExport(dataset);
      const expectedName = store.state.datasetFile.replace(/\.json$/, '.txt');
      const expectedResponse = await fetch(new URL(`./tests/expected/${encodeURIComponent(expectedName)}`, moduleBaseUrl).href);
      if (!expectedResponse.ok) {
        store.set({ isLoading: false, status: 'missingExpected', report: { missingExpected: true, expectedFile: expectedName, generated, generatedLineCount: generated.split(/\r?\n/).length } });
        return;
      }
      const expected = await expectedResponse.text();
      const report = compareText({ expected, generated, expectedFile: expectedName, generatedFile: store.state.datasetFile });
      store.set({ isLoading: false, status: report.success ? 'success' : 'failure', report });
    } catch (error) {
      store.set({ isLoading: false, status: 'failure', error: error.message });
    }
  }

  return { state: store.state, load, setTab, setLevel, setExpectedFile, setDatasetFile, getDownloadUrl, downloadActiveExport, runActiveTnr, runDatasetTnr };
}

function splitScoreName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { lastName: '', firstName: '' };
  if (parts.length === 1) return { lastName: parts[0], firstName: '' };
  return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
}
