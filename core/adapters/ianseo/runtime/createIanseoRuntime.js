import { createIanseoSettingsAdapter } from '../settings/settingsAdapter.js';
import { createIanseoLanguageAdapter } from '../i18n/languageAdapter.js';
import { createIanseoAclAdapter } from '../acl/aclAdapter.js';
import { createIanseoDataAdapter } from '../data/dataAdapter.js';
import fftaModulesConfig from '../../../../config/ffta-modules.config.js';

/**
 * Create the standalone Ianseo runtime context.
 *
 * @param {{ baseUrl?: string }} options
 *   baseUrl — absolute URL of the ffta-modules root, computed from
 *             import.meta.url in main.js so it is correct regardless of
 *             how Ianseo routes the page URL.
 *
 * TODO(ianseo-verified): Verify that $_SESSION['TourId'] is the correct
 * session key for the active tournament in your Ianseo version.
 */
export async function createIanseoRuntime({ baseUrl = './' } = {}) {
  const languageAdapter = createIanseoLanguageAdapter();

  const devConfig = normalizeRuntimeDevConfig(fftaModulesConfig);

  return {
    type: 'ianseo',
    language: languageAdapter.getLanguage(),
    baseUrl,
    dev: devConfig,
    adapters: {
      settings: createIanseoSettingsAdapter({ baseUrl, devConfig }),
      acl: createIanseoAclAdapter({ baseUrl, devConfig }),
      data: createIanseoDataAdapter({ baseUrl, devConfig }),
      notifications: null,
      tournament: {
        async getTournament() {
          try {
            const response = await fetch(baseUrl + 'api/context.php');
            if (!response.ok) return null;
            const payload = await response.json();
            return payload.ok ? (payload.tournament ?? null) : null;
          } catch {
            return null;
          }
        }
      }
    }
  };
}

function normalizeRuntimeDevConfig(config = {}) {
  return {
    devMode: Boolean(config.devMode),
    logLevel: config.logLevel || 'warn',
    exposeGlobal: Boolean(config.exposeGlobal),
    showBadge: Boolean(config.showBadge),
    logs: config.logs || {}
  };
}
