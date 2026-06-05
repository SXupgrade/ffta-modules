import { validateModuleManifest } from '../../module-loader/moduleValidator.js';

const KNOWN_DATA_SERVICES = {
  tournament: ['getCurrent'],
  context: ['getTournament', 'getCurrentUser'],
  entries: ['list', 'get'],
  scores: ['listQualificationScores', 'readQualificationScores', 'getQualificationScore', 'saveQualificationScore', 'writeQualificationScore'],
  targets: ['list', 'assign', 'unassign'],
  clubs: ['list'],
  divisions: ['list'],
  classes: ['list']
};

export function createValidationService() {
  return {
    validateManifest(manifest) {
      const result = validateModuleManifest(manifest);
      const items = result.ok ? [] : result.errors.map((message) => ({ level: 'error', message }));
      if (!manifest?.access?.subFeature) {
        items.push({ level: 'warn', message: 'No ACL subFeature configured.' });
      }
      if ((manifest?.type || 'mvvm') === 'simple') {
        items.push(...validateSimplePage(manifest));
      }
      if (!Array.isArray(manifest?.i18n) || manifest.i18n.length === 0) {
        items.push({ level: 'warn', message: 'No i18n files declared.' });
      }
      return { ok: items.every((item) => item.level !== 'error'), items };
    },
    validateAcl(manifest) {
      const access = manifest?.access || {};
      const items = [];
      if (!access.acl && !access.feature) items.push({ level: 'warn', message: 'ACL feature is not explicit.' });
      if (!access.subFeature) items.push({ level: 'error', message: 'ACL subFeature is required for predictable security.' });
      if (!access.read && !access.levels?.read) items.push({ level: 'warn', message: 'Read ACL level uses runtime fallback.' });
      if (!access.write && !access.levels?.write) items.push({ level: 'warn', message: 'Write ACL level uses runtime fallback.' });
      return { ok: items.every((item) => item.level !== 'error'), items };
    },
    validateSimpleModule(manifest) {
      const items = validateSimplePage(manifest);
      return { ok: items.every((item) => item.level !== 'error'), items };
    }
  };
}

function validateSimplePage(manifest) {
  const actions = Array.isArray(manifest?.page?.actions) ? manifest.page.actions : [];
  const items = [];
  if (!manifest?.page?.titleKey) items.push({ level: 'warn', message: 'Simple page has no titleKey.' });
  if (!actions.length) items.push({ level: 'warn', message: 'Simple page declares no actions.' });
  for (const action of actions) {
    const service = action?.handler?.service;
    const method = action?.handler?.method;
    if (!action?.id) items.push({ level: 'error', message: 'Simple action without id.' });
    if (!service || !method) {
      items.push({ level: 'error', message: `Simple action ${action?.id || '(unknown)'} has no handler service/method.` });
      continue;
    }
    if (KNOWN_DATA_SERVICES[service] && !KNOWN_DATA_SERVICES[service].includes(method)) {
      items.push({ level: 'warn', message: `Simple action ${action.id} references an unknown SDK method: ${service}.${method}.` });
    }
    if (!['read', 'write'].includes(action.permission || 'read')) {
      items.push({ level: 'error', message: `Simple action ${action.id} has invalid permission.` });
    }
  }
  return items;
}
