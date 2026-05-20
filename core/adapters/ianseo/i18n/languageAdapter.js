function normalizeLanguage(language) {
  const value = String(language || '').trim().toLowerCase().replace('_', '-');
  if (!value) return 'en';

  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('en')) return 'en';

  return value.split('-')[0] || 'en';
}

export function createIanseoLanguageAdapter() {
  return {
    getLanguage() {
      const explicitLanguage = window.__FFTA_IANSEO_LANGUAGE__;
      if (explicitLanguage) {
        return normalizeLanguage(explicitLanguage);
      }

      const shellLanguage = document.querySelector('.ffta-modules-shell')?.dataset?.ianseoLanguage;
      if (shellLanguage) {
        return normalizeLanguage(shellLanguage);
      }

      const appLanguage = document.getElementById('ffta-app')?.dataset?.language;
      if (appLanguage) {
        return normalizeLanguage(appLanguage);
      }

      const cookieLanguage = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('UseLanguage='))
        ?.split('=')[1];

      if (cookieLanguage) {
        return normalizeLanguage(decodeURIComponent(cookieLanguage));
      }

      return normalizeLanguage(navigator.language || 'en');
    }
  };
}
