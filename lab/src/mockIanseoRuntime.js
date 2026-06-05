import tournament from '../mock-data/tournament.json' with { type: 'json' };
import entries from '../mock-data/entries.json' with { type: 'json' };
import qualificationScores from '../mock-data/qualification-scores.json' with { type: 'json' };
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
        case 'getCurrentTournament':
          return structuredCloneSafe(dataStore.tournament);
        case 'getCurrentUser':
          return structuredCloneSafe(dataStore.currentUser);
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
      qualificationScores: []
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
        rank: index + 1
      }))
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
        { quId: 999, entryId: 999, name: '', club: null, session: 1, target: '', division: '', class: '', distance: 1, score: null, tens: null, nines: null, rank: null }
      ]
    };
  }
  return {
    tournament: structuredCloneSafe(tournament),
    currentUser: buildCurrentUser(),
    entries: structuredCloneSafe(entries),
    qualificationScores: structuredCloneSafe(qualificationScores)
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
      tens: Math.floor(score / 30) + (index % 3),
      nines: Math.floor(score / 40) + (index % 4),
      rank: index + 1
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
    qualificationScores: generatedScores
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
