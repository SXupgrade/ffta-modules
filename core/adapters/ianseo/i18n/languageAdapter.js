export function createIanseoLanguageAdapter() {
  return {
    getLanguage() {
      const htmlLanguage = document?.documentElement?.lang;
      return htmlLanguage || navigator.language?.slice(0, 2) || 'en';
    }
  };
}
