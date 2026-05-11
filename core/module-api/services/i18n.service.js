export function createI18nService({ language = 'en' } = {}) {
  const namespaces = new Map();
  let currentLanguage = language || 'en';

  function interpolate(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
  }

  return {
    getLocale() {
      return currentLanguage;
    },
    setLocale(language) {
      currentLanguage = language || 'en';
    },
    registerNamespace(namespace, translations) {
      namespaces.set(namespace, translations);
    },
    t(key, params = {}) {
      const [namespace, ...pathParts] = key.split('.');
      const translations = namespaces.get(namespace);
      let value = translations?.[currentLanguage] ?? translations?.en;

      for (const part of pathParts) {
        value = value?.[part];
      }

      return value ? interpolate(value, params) : key;
    }
  };
}
