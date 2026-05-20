function normalizeLanguage(language) {
  const value = String(language || '').trim().toLowerCase().replace('_', '-');
  if (!value) return 'en';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('en')) return 'en';
  return value.split('-')[0] || 'en';
}

export function createI18nService({ language = 'en' } = {}) {
  const namespaces = new Map();
  let currentLanguage = normalizeLanguage(language);

  function interpolate(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
  }

  function resolveTranslation(translations, language) {
    const normalizedLanguage = normalizeLanguage(language);
    return translations?.[normalizedLanguage] ?? translations?.[normalizedLanguage.split('-')[0]] ?? translations?.en;
  }

  return {
    getLocale() {
      return currentLanguage;
    },
    setLocale(language) {
      currentLanguage = normalizeLanguage(language);
    },
    registerNamespace(namespace, translations) {
      namespaces.set(namespace, translations);
    },
    t(key, params = {}) {
      const [namespace, ...pathParts] = key.split('.');
      const translations = namespaces.get(namespace);
      let value = resolveTranslation(translations, currentLanguage);

      for (const part of pathParts) {
        value = value?.[part];
      }

      return value ? interpolate(value, params) : key;
    }
  };
}
