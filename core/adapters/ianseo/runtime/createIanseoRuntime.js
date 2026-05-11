import { createIanseoSettingsAdapter } from '../settings/settingsAdapter.js';
import { createIanseoLanguageAdapter } from '../i18n/languageAdapter.js';

/**
 * Create the standalone Ianseo runtime context.
 *
 * TODO for agent:
 * - Inspect Ianseo public sources to locate the correct bootstrap/config include.
 * - Reuse Ianseo session, DB connection, current language and tournament context.
 * - Do not ask for database credentials.
 */
export async function createIanseoRuntime() {
  const languageAdapter = createIanseoLanguageAdapter();

  return {
    type: 'ianseo',
    language: languageAdapter.getLanguage(),
    adapters: {
      settings: createIanseoSettingsAdapter(),
      notifications: null,
      tournament: {
        async getTournament() {
          // TODO: call API endpoint backed by Ianseo context.
          return null;
        }
      }
    }
  };
}
