import tournament from '../mock-data/tournament.json' with { type: 'json' };
import entries from '../mock-data/entries.json' with { type: 'json' };
import qualificationScores from '../mock-data/qualification-scores.json' with { type: 'json' };
import sessions from '../mock-data/sessions.json' with { type: 'json' };
import recordAreas from '../mock-data/record-areas.json' with { type: 'json' };
import records from '../mock-data/records.json' with { type: 'json' };
import brokenRecords from '../mock-data/broken-records.json' with { type: 'json' };
import officials from '../mock-data/officials.json' with { type: 'json' };
import aclProfiles from '../mock-data/acl-profiles.json' with { type: 'json' };
import scenarios from '../mock-data/scenarios.json' with { type: 'json' };
import fftaModulesConfig from '../../config/ffta-modules.config.js';

const LAB_STATE_KEY = 'fftaLab.state.v2';
const SETTINGS_KEY = 'fftaLab.settings.v1';
const GENERATED_COMPETITION_KEY = 'fftaLab.generatedCompetition.v1';

export function createMockIanseoRuntime({ baseUrl = '../' } = {}) {
  const state = createLabState();
  let dataStore = buildDataStore(state.get().dataScenario);

  return {
    type: 'ianseo',
    isLab: true,
    language: state.get().language,
    baseUrl,
    dev: resolveLabDevConfig(state.get()),
    lab: {
      state,
      aclProfiles,
      scenarios,
      resetData() {
        if (state.get().dataScenario === 'generated') {
          localStorage.removeItem(GENERATED_COMPETITION_KEY);
          state.set({ dataScenario: 'standard' });
        }
        dataStore = buildDataStore(state.get().dataScenario);
      },
      reloadScenario(scenarioId) {
        state.set({ dataScenario: scenarioId });
        dataStore = buildDataStore(scenarioId);
      },
      generateCompetition(options = {}) {
        const generated = buildGeneratedDataStore(options);
        localStorage.setItem(GENERATED_COMPETITION_KEY, JSON.stringify({ options, data: generated, generatedAt: new Date().toISOString() }));
        state.set({ dataScenario: 'generated' });
        dataStore = generated;
        return structuredCloneSafe(generated);
      },
      getDataSnapshot() {
        return structuredCloneSafe(dataStore);
      }
    },
    adapters: {
      settings: createLabSettingsAdapter(),
      acl: createLabAclAdapter({ state, aclProfiles }),
      data: createLabDataAdapter({ getDataStore: () => dataStore, state }),
      notifications: createLabNotificationAdapter(),
      logger: console,
      tournament: {
        async getTournament() {
          return structuredCloneSafe(dataStore.tournament);
        }
      }
    }
  };
}

function createLabState() {
  const defaultState = {
    aclProfile: 'admin',
    language: window.__FFTA_IANSEO_LANGUAGE__ || 'en',
    apiMode: 'normal',
    dataScenario: 'standard',
    theme: 'light',
    viewport: 'desktop',
    simulateDelay: false,
    simulateErrors: false,
    devMode: Boolean(fftaModulesConfig.devMode)
  };
  let current = { ...defaultState, ...readJson(LAB_STATE_KEY, {}) };
  if (current.simulateDelay && current.apiMode === 'normal') current.apiMode = 'slow';
  if (current.simulateErrors && current.apiMode === 'normal') current.apiMode = 'error';
  const listeners = new Set();

  function emit() {
    localStorage.setItem(LAB_STATE_KEY, JSON.stringify(current));
    for (const listener of listeners) listener({ ...current });
  }

  return {
    get() {
      return { ...current };
    },
    set(patch) {
      current = { ...current, ...patch };
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

function createLabSettingsAdapter() {
  let values = readJson(SETTINGS_KEY, {});
  return {
    async get(key, fallback = null) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : fallback;
    },
    async set(key, value) {
      values[key] = value;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
      return value;
    }
  };
}

function createLabAclAdapter({ state, aclProfiles }) {
  return {
    async getAccess(moduleOrManifest) {
      const moduleId = typeof moduleOrManifest === 'string' ? moduleOrManifest : moduleOrManifest?.id;
      const profileId = state.get().aclProfile;
      const profile = aclProfiles[profileId] || aclProfiles.admin;
      return profile.modules?.[moduleId] || profile.defaultAccess || 'write';
    }
  };
}

function createLabDataAdapter({ getDataStore, state }) {
  return {
    async request(action, payload = {}) {
      await simulateApiMode(state.get().apiMode, action);
      const dataStore = getDataStore();

      switch (action) {
        case 'scanOrganizerAchievements':
          return buildOrganizerAchievementMetrics(dataStore);
        case 'getCurrentTournament':
          return structuredCloneSafe(dataStore.tournament);
        case 'getCurrentUser':
          return structuredCloneSafe(dataStore.currentUser);
        case 'listOfficials':
          return filterByKnownFields(dataStore.officials || [], payload);
        case 'listEntries':
          return filterByKnownFields(dataStore.entries, payload);
        case 'getEntry':
          return findById(dataStore.entries, payload.entryId);
        case 'readQualificationScores':
          return filterByKnownFields(dataStore.qualificationScores, payload);
        case 'getQualificationScore':
          return findScore(dataStore.qualificationScores, payload.entryId || payload.quId);
        case 'writeQualificationScore':
          return writeQualificationScore(dataStore.qualificationScores, payload);
        case 'recalculateQualificationRanking':
          return recalculateQualificationRanking(dataStore.qualificationScores, payload);
        case 'listTargets':
          return buildTargets(dataStore.entries, payload);
        case 'assignTarget':
          return assignTarget(dataStore.entries, payload);
        case 'unassignTarget':
          return unassignTarget(dataStore.entries, payload);
        case 'listClubs':
          return uniqueRows(dataStore.entries, ['clubCode', 'clubName']);
        case 'listDivisions':
          return uniqueCodes(dataStore.entries, 'division');
        case 'listClasses':
          return uniqueCodes(dataStore.entries, 'class');
        case 'getCheckScorecardContext':
          return buildCheckScorecardContext(dataStore);
        case 'listCheckScorecardSessions':
          return structuredCloneSafe(dataStore.sessions || []);
        case 'listCheckScorecardRows':
          return listCheckScorecardRows(dataStore, payload);
        case 'setCheckScorecardConfirm':
          return setCheckScorecardConfirm(dataStore, payload);
        case 'getRecordsDashboard':
          return buildRecordsDashboard(dataStore);
        case 'saveMonitoredRecord':
          return saveMonitoredRecordMock(dataStore, payload);
        case 'saveRecord':
          return saveRecordMock(dataStore, payload);
        case 'importRecords':
          return importRecordsMock(dataStore, payload);
        case 'activateTournamentRecords':
          return activateTournamentRecordsMock(dataStore, payload);
        case 'saveRecordArea':
          return saveRecordAreaMock(dataStore, payload);
        case 'deleteRecordArea':
          return deleteRecordAreaMock(dataStore, payload);
        case 'syncTournamentRecordAreas':
          return syncTournamentRecordAreasMock(dataStore, payload);
        case 'updateGlobalRecordsFromBroken':
          return updateGlobalRecordsFromBrokenMock(dataStore);
        case 'checkBrokenRecords':
          return checkBrokenRecordsMock(dataStore);
        default:
          throw new Error(`Unknown lab data action: ${action}`);
      }
    }
  };
}

async function simulateApiMode(apiMode, action) {
  if (apiMode === 'slow') {
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
  if (apiMode === 'offline') {
    throw new Error(`Lab offline mode: ${action} cannot reach the API.`);
  }
  if (apiMode === 'error') {
    throw new Error(`Lab simulated API error for action: ${action}`);
  }
  if (apiMode === 'random-error' && Math.random() < 0.35) {
    throw new Error(`Lab random API error for action: ${action}`);
  }
}

function createLabNotificationAdapter() {
  return {
    info(message) { console.info('[ffta-lab]', message); },
    success(message) { console.info('[ffta-lab:success]', message); },
    warning(message) { console.warn('[ffta-lab:warning]', message); },
    error(message) { console.error('[ffta-lab:error]', message); }
  };
}

function buildDataStore(scenarioId = 'standard') {
  if (scenarioId === 'generated') {
    const persisted = readJson(GENERATED_COMPETITION_KEY, null);
    if (persisted?.data) return structuredCloneSafe(persisted.data);
    return buildGeneratedDataStore({ entries: 48, sessions: 2, archersPerTarget: 4 });
  }
  if (scenarioId === 'empty') {
    return {
      tournament: structuredCloneSafe({ ...tournament, name: 'Empty Lab Tournament' }),
      currentUser: buildCurrentUser(),
      entries: [],
      qualificationScores: [],
      sessions: [],
      recordAreas: [],
      records: [],
      brokenRecords: [],
      officials: []
    };
  }
  if (scenarioId === 'large') {
    const generatedEntries = generateEntries(96);
    return {
      tournament: structuredCloneSafe({ ...tournament, name: 'Large Lab Tournament' }),
      currentUser: buildCurrentUser(),
      entries: generatedEntries,
      qualificationScores: generatedEntries.map((entry, index) => ({
        quId: entry.id,
        entryId: entry.id,
        name: entry.name,
        club: entry.clubName,
        session: entry.session,
        target: entry.target,
        division: entry.division,
        class: entry.class,
        distance: 1,
        score: 240 + (index % 91),
        tens: index % 24,
        nines: index % 18,
        rank: index + 1,
        hits: 60 + (index % 12),
        gold: index % 24,
        xnine: index % 18,
        tieBreak: '',
        confirm: 0,
        d1Score: 240 + (index % 91),
        d1Hits: 60 + (index % 12),
        d1Gold: index % 24,
        d1Xnine: index % 18,
        d1Arrowstring: ''
      })),
      sessions: buildLabSessions(2),
      recordAreas: structuredCloneSafe(recordAreas),
      records: structuredCloneSafe(records),
      brokenRecords: structuredCloneSafe(brokenRecords),
      officials: structuredCloneSafe(officials)
    };
  }
  if (scenarioId === 'invalid') {
    return {
      tournament: structuredCloneSafe({ ...tournament, name: 'Invalid Data Lab Tournament' }),
      currentUser: buildCurrentUser(),
      entries: [
        ...structuredCloneSafe(entries),
        { id: 999, code: '', firstName: '', lastName: '', name: '', clubCode: null, clubName: null, division: '', class: '', session: 1, target: '' }
      ],
      qualificationScores: [
        ...structuredCloneSafe(qualificationScores),
        { quId: 999, entryId: 999, name: '', club: null, session: 1, target: '', division: '', class: '', distance: 1, score: null, tens: null, nines: null, rank: null, hits: null, gold: null, xnine: null, tieBreak: '', confirm: 0 }
      ],
      sessions: structuredCloneSafe(sessions),
      recordAreas: structuredCloneSafe(recordAreas),
      records: structuredCloneSafe(records),
      brokenRecords: structuredCloneSafe(brokenRecords),
      officials: [
        ...structuredCloneSafe(officials),
        { id: 999, name: '', role: '' }
      ]
    };
  }
  return {
    tournament: structuredCloneSafe(tournament),
    currentUser: buildCurrentUser(),
    entries: structuredCloneSafe(entries),
    qualificationScores: structuredCloneSafe(qualificationScores),
    sessions: structuredCloneSafe(sessions),
    recordAreas: structuredCloneSafe(recordAreas),
    records: structuredCloneSafe(records),
    brokenRecords: structuredCloneSafe(brokenRecords),
    officials: structuredCloneSafe(officials)
  };
}

function buildLabSessions(sessionCount) {
  return Array.from({ length: Math.max(1, Number(sessionCount) || 1) }, (_, index) => ({
    id: index + 1,
    label: `${index + 1} - Qualification`,
    firstTarget: 1,
    lastTarget: 12
  }));
}


function buildOrganizerAchievementMetrics(dataStore) {
  const entries = Array.isArray(dataStore.entries) ? dataStore.entries : [];
  const scores = Array.isArray(dataStore.qualificationScores) ? dataStore.qualificationScores : [];
  const tournament = dataStore.tournament || {};
  const tournamentCount = Number(tournament.generated ? 12 : 3);
  const assignedEntryCount = entries.filter((entry) => String(entry.target || entry.targetNo || '').trim()).length;
  const scoredEntryCount = scores.filter((score) => Number(score.score || score.total || 0) > 0).length;
  const rankedEntryCount = scores.filter((score) => Number(score.rank || 0) > 0).length;
  const sessions = new Set(entries.map((entry) => entry.session).filter(Boolean));
  const divisions = new Set(entries.map((entry) => entry.division).filter(Boolean));
  const clubs = new Set(entries.map((entry) => entry.clubCode || entry.clubName).filter(Boolean));
  return {
    scannedAt: new Date().toISOString(),
    scanScope: 'all',
    tournamentCount,
    tournamentCount2026: 1,
    tournamentName: tournament.name || tournament.code || '',
    totalEntryCount: entries.length * tournamentCount,
    entryCount: entries.length * tournamentCount,
    maxEntriesInTournament: entries.length,
    assignedEntryCount: assignedEntryCount * tournamentCount,
    scoredEntryCount: scoredEntryCount * tournamentCount,
    rankedEntryCount: rankedEntryCount * tournamentCount,
    targetCount: new Set(entries.map((entry) => `${entry.session || ''}|${entry.target || ''}`).filter(Boolean)).size,
    sessionCount: sessions.size || Number(tournament.sessions || 0),
    maxSessionCount: sessions.size || Number(tournament.sessions || 0),
    multiSessionTournamentCount: sessions.size >= 2 ? tournamentCount : 0,
    divisionCount: divisions.size,
    maxDivisionCount: divisions.size,
    maxClubCount: clubs.size,
    completedFieldPlanCount: entries.length > 0 && assignedEntryCount === entries.length ? tournamentCount : 0,
    fieldCompletionPercent: entries.length ? Math.round((assignedEntryCount / entries.length) * 100) : 0,
    scoredTournamentCount: scoredEntryCount > 0 ? tournamentCount : 0
  };
}

function buildCurrentUser() {
  return {
    id: 1,
    login: 'developer',
    name: 'Lab Developer',
    locale: window.__FFTA_IANSEO_LANGUAGE__ || 'en'
  };
}

function generateEntries(count, options = {}) {
  const divisions = options.divisions || ['CL', 'CO', 'BB'];
  const classes = options.classes || ['S1H', 'S1F', 'S2H', 'S2F', 'U18H', 'U18F'];
  const sessions = Math.max(1, Number(options.sessions || 2));
  const archersPerTarget = Math.min(4, Math.max(1, Number(options.archersPerTarget || 4)));
  const seededRandom = createSeededRandom(options.seed || 2026);
  return Array.from({ length: count }, (_, index) => {
    const id = 1000 + index + 1;
    const session = (index % sessions) + 1;
    const sessionIndex = Math.floor(index / sessions);
    const targetNumber = String(Math.floor(sessionIndex / archersPerTarget) + 1).padStart(3, '0');
    const position = ['A', 'B', 'C', 'D'][sessionIndex % archersPerTarget];
    return {
      id,
      code: `LAB${id}`,
      firstName: `Archer${index + 1}`,
      lastName: `Test${index + 1}`,
      name: `TEST${index + 1} Archer${index + 1}`,
      clubCode: `08${String(index % 8).padStart(5, '0')}`,
      clubName: `Lab Club ${(index % 8) + 1}`,
      country: 'FRA',
      division: divisions[index % divisions.length],
      class: classes[index % classes.length],
      session,
      target: `${targetNumber}${position}`,
      rating: Math.round(500 + seededRandom() * 500)
    };
  });
}

function buildGeneratedDataStore(options = {}) {
  const entryCount = clampNumber(options.entries, 1, 2000, 48);
  const sessions = clampNumber(options.sessions, 1, 8, 2);
  const archersPerTarget = clampNumber(options.archersPerTarget, 1, 4, 4);
  const seed = clampNumber(options.seed, 1, 999999, 2026);
  const generatedEntries = generateEntries(entryCount, { sessions, archersPerTarget, seed });
  const random = createSeededRandom(seed + 99);
  const generatedScores = generatedEntries.map((entry, index) => {
    const score = Math.round(180 + random() * 180);
    const hits = Math.min(72, Math.round(score / 5));
    const gold = Math.floor(score / 30) + (index % 3);
    const xnine = Math.floor(score / 40) + (index % 4);
    return {
      quId: entry.id,
      entryId: entry.id,
      name: entry.name,
      club: entry.clubName,
      session: entry.session,
      target: entry.target,
      division: entry.division,
      class: entry.class,
      distance: 1,
      score,
      tens: gold,
      nines: xnine,
      rank: index + 1,
      hits,
      gold,
      xnine,
      tieBreak: '',
      confirm: 0,
      d1Score: score,
      d1Hits: hits,
      d1Gold: gold,
      d1Xnine: xnine,
      d1Arrowstring: ''
    };
  }).sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    tournament: {
      ...structuredCloneSafe(tournament),
      code: `LAB${seed}`,
      name: `Generated Lab Tournament (${entryCount} archers)`,
      sessions,
      generated: true,
      generatedOptions: { entries: entryCount, sessions, archersPerTarget, seed }
    },
    currentUser: buildCurrentUser(),
    entries: generatedEntries,
    qualificationScores: generatedScores,
    sessions: buildLabSessions(sessions),
    recordAreas: [],
    records: [],
    brokenRecords: [],
    officials: structuredCloneSafe(officials)
  };
}

function createSeededRandom(seed) {
  let value = Number(seed) || 1;
  return function seededRandom() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function filterByKnownFields(rows, filters = {}) {
  const normalizedFilters = Object.entries(filters || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (!normalizedFilters.length) return structuredCloneSafe(rows);

  return structuredCloneSafe(rows.filter((row) => normalizedFilters.every(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(row, key)) return true;
    return String(row[key]) === String(value);
  })));
}

function findById(rows, id) {
  const found = rows.find((row) => Number(row.id || row.entryId) === Number(id));
  if (!found) throw new Error(`Unknown entry: ${id}`);
  return structuredCloneSafe(found);
}

function findScore(rows, id) {
  const found = rows.find((row) => Number(row.quId) === Number(id) || Number(row.entryId) === Number(id));
  if (!found) throw new Error(`Unknown qualification score row: ${id}`);
  return structuredCloneSafe(found);
}

function writeQualificationScore(rows, payload = {}) {
  const quId = Number(payload.quId || payload.qualificationId || payload.entryId);
  if (!quId) throw new Error('Missing quId for writeQualificationScore.');

  const existing = rows.find((row) => Number(row.quId) === quId || Number(row.entryId) === quId);
  if (!existing) throw new Error(`Unknown qualification score row: ${quId}`);

  const allowedFields = ['distance', 'score', 'total', 'tens', 'nines', 'rank'];
  for (const field of allowedFields) {
    if (payload[field] !== undefined) existing[field] = payload[field];
  }
  if (payload.score !== undefined) existing.total = Number(payload.score);
  if (payload.total !== undefined) existing.score = Number(payload.total);

  return structuredCloneSafe(existing);
}

function recalculateQualificationRanking(rows, payload = {}) {
  const session = payload.session ? Number(payload.session) : null;
  const relevantRows = rows
    .filter((row) => !session || Number(row.session) === session)
    .sort((left, right) => {
      const scoreDiff = Number(right.total ?? right.score ?? 0) - Number(left.total ?? left.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const tensDiff = Number(right.tens ?? 0) - Number(left.tens ?? 0);
      if (tensDiff !== 0) return tensDiff;
      return Number(right.nines ?? 0) - Number(left.nines ?? 0);
    });

  for (const [index, row] of relevantRows.entries()) {
    row.rank = index + 1;
  }

  return structuredCloneSafe(relevantRows);
}

function assignTarget(rows, payload = {}) {
  const entryId = Number(payload.entryId || payload.id);
  const target = String(payload.target || payload.targetNo || '').trim();
  const session = payload.session ? Number(payload.session) : null;
  if (!entryId || !target) throw new Error('assignTarget expects entryId and target.');
  const entry = rows.find((row) => Number(row.id || row.entryId) === entryId);
  if (!entry) throw new Error(`Unknown entry: ${entryId}`);
  entry.target = target;
  if (session) entry.session = session;
  return structuredCloneSafe(entry);
}

function unassignTarget(rows, payload = {}) {
  const entryId = Number(payload.entryId || payload.id);
  if (!entryId) throw new Error('unassignTarget expects entryId.');
  const entry = rows.find((row) => Number(row.id || row.entryId) === entryId);
  if (!entry) throw new Error(`Unknown entry: ${entryId}`);
  entry.target = '';
  return structuredCloneSafe(entry);
}

function buildCheckScorecardContext(dataStore) {
  const tournament = dataStore.tournament || {};
  const numDistances = 1;
  return {
    id: Number(tournament.id) || 1,
    code: tournament.code || tournament.shortName || '',
    name: tournament.name || tournament.code || '',
    numDistances,
    numEnds: Number(tournament.numEnds) || 12,
    maxDistanceScore: Number(tournament.maxDistanceScore) || 360,
    fullConfirmMask: Math.pow(2, numDistances + 1) - 2
  };
}

function buildCheckScorecardRow(entry, score, numDistances) {
  const confirm = Number(score?.confirm || 0);
  const distances = [];
  for (let distance = 1; distance <= numDistances; distance++) {
    const bit = Math.pow(2, distance);
    distances.push({
      index: distance,
      bit,
      confirmed: (confirm & bit) !== 0,
      score: Number(score?.[`d${distance}Score`] ?? score?.score ?? 0),
      hits: Number(score?.[`d${distance}Hits`] ?? score?.hits ?? 0),
      gold: Number(score?.[`d${distance}Gold`] ?? score?.gold ?? 0),
      xnine: Number(score?.[`d${distance}Xnine`] ?? score?.xnine ?? 0),
      arrowString: String(score?.[`d${distance}Arrowstring`] ?? '')
    });
  }
  return {
    id: Number(entry.id),
    license: entry.code || '',
    lastName: entry.lastName || '',
    firstName: entry.firstName || '',
    category: `${entry.class || ''}${entry.division || ''}`,
    clubCode: entry.clubCode || '',
    clubName: entry.clubName || '',
    target: entry.target || '',
    totalScore: Number(score?.score ?? 0),
    totalHits: Number(score?.hits || 0),
    totalGold: Number(score?.gold || 0),
    totalXnine: Number(score?.xnine || 0),
    tieBreak: score?.tieBreak || '',
    quConfirm: confirm,
    globalConfirmed: (confirm & 1) !== 0,
    distances
  };
}

function listCheckScorecardRows(dataStore, payload = {}) {
  const session = payload.session ? Number(payload.session) : null;
  const numDistances = buildCheckScorecardContext(dataStore).numDistances;
  const entries = (dataStore.entries || []).filter((entry) => !session || Number(entry.session) === session);
  return entries.map((entry) => {
    const score = (dataStore.qualificationScores || []).find((row) => Number(row.entryId) === Number(entry.id));
    return buildCheckScorecardRow(entry, score, numDistances);
  });
}

function setCheckScorecardConfirm(dataStore, payload = {}) {
  const id = Number(payload.id);
  const distance = Number(payload.distance || 0);
  const confirmed = Boolean(payload.confirmed);
  const score = (dataStore.qualificationScores || []).find((row) => Number(row.entryId) === id);
  if (!score) throw new Error(`Unknown archer: ${id}`);
  const entry = (dataStore.entries || []).find((row) => Number(row.id) === id);
  if (!entry) throw new Error(`Unknown archer: ${id}`);
  const bit = Math.pow(2, distance);
  const current = Number(score.confirm || 0);
  score.confirm = confirmed ? (current | bit) : (current & ~bit);
  const numDistances = buildCheckScorecardContext(dataStore).numDistances;
  return buildCheckScorecardRow(entry, score, numDistances);
}

function stripRecordScope(row) {
  const clone = structuredCloneSafe(row);
  delete clone.scope;
  return clone;
}

function buildRecordsDashboard(dataStore) {
  const areas = structuredCloneSafe(dataStore.recordAreas || []);
  const allRecords = dataStore.records || [];
  const globalRecords = allRecords.filter((row) => row.scope === 'global').map(stripRecordScope);
  const tournamentRecords = allRecords.filter((row) => row.scope === 'tournament').map(stripRecordScope);
  const monitoredRecords = areas
    .filter((area) => tournamentRecords.some((row) => row.areaCode === area.code))
    .map((area) => ({
      tournamentId: dataStore.tournament?.id || 1,
      areaCode: area.code,
      areaName: area.name,
      team: 0,
      para: 0,
      headerCode: area.code.slice(0, 2),
      header: area.name,
      color: '000000',
      updatedAt: new Date().toISOString()
    }));
  const recordCodes = [...new Set(globalRecords.map((row) => row.areaCode))].map((areaCode) => {
    const area = areas.find((entry) => entry.code === areaCode);
    const matching = globalRecords.filter((row) => row.areaCode === areaCode);
    return {
      areaCode,
      areaName: area?.name || areaCode,
      team: 0,
      para: 0,
      recordsCount: matching.length,
      updatedAt: new Date().toISOString()
    };
  });
  return {
    tournament: structuredCloneSafe(dataStore.tournament || null),
    areas,
    monitoredRecords,
    recordCodes,
    globalRecords,
    records: tournamentRecords,
    brokenRecords: structuredCloneSafe(dataStore.brokenRecords || []),
    warnings: monitoredRecords.length
      ? []
      : [{ level: 'warning', message: 'No monitored record area is configured for this tournament.' }]
  };
}

function saveRecordAreaMock(dataStore, payload = {}) {
  const code = String(payload.areaCode || '').trim().toUpperCase();
  if (!code) throw new Error('Record area code is required.');
  const name = String(payload.areaName || code).trim() || code;
  const areas = dataStore.recordAreas || (dataStore.recordAreas = []);
  const existing = areas.find((area) => area.code === code);
  if (existing) {
    existing.name = name;
  } else {
    areas.push({ code, name, bitLevel: 1, waMaintenance: 0, globalRecordsCount: 0, tournamentRecordsCount: 0 });
  }
  return { ok: true };
}

function deleteRecordAreaMock(dataStore, payload = {}) {
  const code = String(payload.areaCode || '').trim().toUpperCase();
  if (!code) throw new Error('Record area code is required.');
  dataStore.recordAreas = (dataStore.recordAreas || []).filter((area) => area.code !== code);
  dataStore.records = (dataStore.records || []).filter((row) => row.areaCode !== code);
  dataStore.brokenRecords = (dataStore.brokenRecords || []).filter((row) => row.areaCode !== code);
  return { ok: true };
}

function saveMonitoredRecordMock(dataStore, payload = {}) {
  const code = String(payload.areaCode || 'FFTA').trim().toUpperCase();
  saveRecordAreaMock(dataStore, { areaCode: code, areaName: payload.areaName || code });
  const area = (dataStore.recordAreas || []).find((entry) => entry.code === code);
  if (area) area.tournamentRecordsCount = Math.max(1, area.tournamentRecordsCount || 0);
  return { ok: true };
}

function importRecordsMock(dataStore, payload = {}) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const scope = payload.targetTournament === 'current' || Number(payload.targetTournament || 0) > 0 ? 'tournament' : 'global';
  const records = dataStore.records || (dataStore.records = []);
  let imported = 0;
  for (const row of rows) {
    const areaCode = String(row.recordCode || row.areaCode || payload.areaCode || '').trim().toUpperCase();
    const category = String(row.category || '').trim().toUpperCase();
    const total = Number(row.total || 0);
    if (!areaCode || !category || !total) continue;
    saveRecordAreaMock(dataStore, { areaCode, areaName: payload.areaName || areaCode });
    const record = {
      scope,
      areaCode,
      recordCode: areaCode,
      team: row.team ? 1 : 0,
      isTeam: row.team ? 1 : 0,
      para: row.para ? 1 : 0,
      isPara: row.para ? 1 : 0,
      category,
      categoryName: row.categoryName || category,
      division: row.division || '',
      distance: row.distance || row.recordLabel || '',
      recordLabel: row.distance || row.recordLabel || '',
      total,
      xNine: Number(row.xNine || 0),
      tieBreaker: Number(row.xNine || 0),
      recordDate: row.date || '',
      date: row.date || '',
      phase: Number(row.phase ?? 1),
      subphase: Number(row.subphase ?? 0),
      isDouble: row.double ? 1 : 0,
      isMixed: row.double ? 1 : 0,
      meters: Number(row.meters || 0),
      maxScore: Number(row.maxScore || 0),
      holderName: row.archer || row.holderName || '',
      holderClubOrCountry: row.noc || 'FRA',
      place: row.place || '',
      source: ''
    };
    const existingIndex = records.findIndex((existing) => existing.scope === scope && existing.areaCode === areaCode && existing.category === category);
    if (existingIndex >= 0) records[existingIndex] = record;
    else records.push(record);
    imported++;
  }
  return { imported };
}

function saveRecordMock(dataStore, payload = {}) {
  const record = payload.record || {};
  const targetTournament = payload.targetTournament === 'current' ? 'current' : 0;
  return importRecordsMock(dataStore, {
    targetTournament,
    rows: [record]
  });
}

function activateTournamentRecordsMock(dataStore, payload = {}) {
  const codes = Array.isArray(payload.recordCodes)
    ? payload.recordCodes.map((code) => String(code).trim().toUpperCase()).filter(Boolean)
    : [];
  if (!codes.length) return { activatedCodes: [], copiedRecords: 0 };
  const records = dataStore.records || (dataStore.records = []);
  let copied = 0;
  for (const record of records.filter((row) => row.scope === 'global' && codes.includes(row.areaCode))) {
    const clone = { ...record, scope: 'tournament' };
    const existingIndex = records.findIndex((row) => row.scope === 'tournament' && row.areaCode === clone.areaCode && row.category === clone.category);
    if (existingIndex >= 0) records[existingIndex] = clone;
    else records.push(clone);
    copied++;
  }
  return { activatedCodes: codes, copiedRecords: copied };
}

function syncTournamentRecordAreasMock(dataStore, payload = {}) {
  const codes = Array.isArray(payload.areaCodes)
    ? payload.areaCodes.map((code) => String(code).trim().toUpperCase()).filter(Boolean)
    : [];
  if (!codes.length) {
    dataStore.records = (dataStore.records || []).filter((row) => row.scope !== 'tournament');
    dataStore.brokenRecords = [];
    return { selectedCodes: [], copiedRecords: 0, removedRecords: 'all' };
  }
  dataStore.records = (dataStore.records || []).filter((row) => row.scope !== 'tournament' || codes.includes(row.areaCode));
  const { copiedRecords } = activateTournamentRecordsMock(dataStore, { recordCodes: codes });
  return { selectedCodes: codes, copiedRecords };
}

function checkBrokenRecordsMock(dataStore) {
  const tournamentRecords = (dataStore.records || []).filter((row) => row.scope === 'tournament' && !row.team);
  const entries = dataStore.entries || [];
  const scores = dataStore.qualificationScores || [];
  const broken = [];
  for (const record of tournamentRecords) {
    for (const entry of entries) {
      const category = `${entry.class || ''}${entry.division || ''}`;
      if (category !== record.category) continue;
      const score = scores.find((row) => Number(row.entryId) === Number(entry.id));
      const total = Number(score?.score || 0);
      if (total > Number(record.total || 0)) {
        broken.push({
          areaCode: record.areaCode,
          athleteId: entry.id,
          teamId: 0,
          category: record.category,
          team: 0,
          para: 0,
          eventCode: record.category,
          brokenAt: new Date().toISOString(),
          previousTotal: record.total,
          previousXNine: record.xNine,
          firstName: entry.firstName,
          lastName: entry.lastName,
          countryName: entry.clubName || entry.country || ''
        });
      }
    }
  }
  dataStore.brokenRecords = broken;
  return { scope: 'individual_qualification', brokenCount: broken.length };
}

function updateGlobalRecordsFromBrokenMock(dataStore) {
  const broken = dataStore.brokenRecords || [];
  const records = dataStore.records || (dataStore.records = []);
  const scores = dataStore.qualificationScores || [];
  let updated = 0;
  for (const brokenRow of broken) {
    const score = scores.find((row) => Number(row.entryId) === Number(brokenRow.athleteId));
    const newTotal = Number(score?.score || 0);
    if (!newTotal) continue;
    const globalIndex = records.findIndex((row) => row.scope === 'global' && row.areaCode === brokenRow.areaCode && row.category === brokenRow.category);
    if (globalIndex < 0) continue;
    if (newTotal > Number(records[globalIndex].total || 0)) {
      records[globalIndex] = {
        ...records[globalIndex],
        total: newTotal,
        xNine: Number(score?.xnine || 0),
        tieBreaker: Number(score?.xnine || 0),
        holderName: `${brokenRow.firstName || ''} ${brokenRow.lastName || ''}`.trim(),
        holderClubOrCountry: brokenRow.countryName || records[globalIndex].holderClubOrCountry
      };
      updated++;
    }
  }
  return { updatedRecords: updated };
}

function buildTargets(entriesRows, filters = {}) {
  const session = filters.session ? Number(filters.session) : null;
  const relevantEntries = session ? entriesRows.filter((entry) => Number(entry.session) === session) : entriesRows;
  const targets = new Map();

  for (const entry of relevantEntries) {
    const targetNo = String(entry.target || '').slice(0, 3) || '000';
    if (!targets.has(targetNo)) {
      targets.set(targetNo, { target: targetNo, targetNo, session: entry.session, archers: [] });
    }
    targets.get(targetNo).archers.push(structuredCloneSafe(entry));
  }

  return [...targets.values()].sort((left, right) => String(left.target).localeCompare(String(right.target)));
}

function uniqueRows(rows, keys) {
  const map = new Map();
  for (const row of rows) {
    const id = keys.map((key) => row[key] || '').join('|');
    if (!map.has(id)) {
      map.set(id, Object.fromEntries(keys.map((key) => [key, row[key] || ''])));
    }
  }
  return [...map.values()].filter((row) => Object.values(row).some(Boolean));
}

function uniqueCodes(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))]
    .sort()
    .map((code) => ({ code, label: code }));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function resolveLabDevConfig(stateValue) {
  const enabled = Boolean(stateValue?.devMode || fftaModulesConfig.devMode);
  return {
    ...(fftaModulesConfig || {}),
    devMode: enabled,
    logLevel: enabled ? (fftaModulesConfig.logLevel || 'debug') : (fftaModulesConfig.logLevel || 'warn'),
    exposeGlobal: enabled ? (fftaModulesConfig.exposeGlobal ?? true) : Boolean(fftaModulesConfig.exposeGlobal),
    showBadge: enabled ? (fftaModulesConfig.showBadge ?? true) : Boolean(fftaModulesConfig.showBadge),
    logs: enabled
      ? { runtime: true, modules: true, acl: true, data: true, api: true, ...(fftaModulesConfig.logs || {}) }
      : (fftaModulesConfig.logs || {})
  };
}
