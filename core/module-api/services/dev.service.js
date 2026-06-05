const DEFAULT_DEV_CONFIG = {
  devMode: false,
  logLevel: 'warn',
  exposeGlobal: false,
  showBadge: false,
  logs: {}
};

const LEVELS = ['debug', 'info', 'warn', 'error', 'silent'];

export function createDevService(config = {}) {
  const normalized = normalizeDevConfig(config);

  function isEnabled(channel = 'runtime') {
    if (!normalized.devMode) return false;
    return normalized.logs?.[channel] === true || normalized.logs?.all === true;
  }

  function shouldLog(level = 'debug', channel = 'runtime') {
    if (!isEnabled(channel)) return false;
    const currentLevelIndex = LEVELS.indexOf(normalized.logLevel);
    const requestedLevelIndex = LEVELS.indexOf(level);
    if (currentLevelIndex === -1 || requestedLevelIndex === -1) return true;
    return requestedLevelIndex >= currentLevelIndex && normalized.logLevel !== 'silent';
  }

  return {
    config: Object.freeze(normalized),
    enabled: normalized.devMode,
    isEnabled,
    shouldLog,
    shouldExposeGlobal() {
      return Boolean(normalized.devMode && normalized.exposeGlobal);
    },
    shouldShowBadge() {
      return Boolean(normalized.devMode && normalized.showBadge);
    }
  };
}

export function normalizeDevConfig(config = {}) {
  const logs = { ...(DEFAULT_DEV_CONFIG.logs || {}), ...(config.logs || {}) };
  return {
    ...DEFAULT_DEV_CONFIG,
    ...config,
    logs,
    devMode: Boolean(config.devMode),
    logLevel: LEVELS.includes(config.logLevel) ? config.logLevel : DEFAULT_DEV_CONFIG.logLevel,
    exposeGlobal: Boolean(config.exposeGlobal),
    showBadge: Boolean(config.showBadge)
  };
}
