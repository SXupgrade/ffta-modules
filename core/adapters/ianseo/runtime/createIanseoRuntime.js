import { createIanseoSettingsAdapter } from '../settings/settingsAdapter.js';
import { createIanseoLanguageAdapter } from '../i18n/languageAdapter.js';

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

  return {
    type: 'ianseo',
    language: languageAdapter.getLanguage(),
    baseUrl,
    adapters: {
      settings: createIanseoSettingsAdapter({ baseUrl }),
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
