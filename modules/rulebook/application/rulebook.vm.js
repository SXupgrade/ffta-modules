import { OFFICIAL_PDF_URL, QUICK_RULES, RULEBOOK_META, SECTIONS } from '../data/rulebook.index.js';
import { getEntry, searchRules } from '../domain/rulebook.search.js';

export function createRulebookViewModel({ app, store }) {
  const state = store.getState();
  state.__store = store;

  function sync() {
    Object.assign(state, store.getState(), { __store: store });
  }

  store.subscribe(sync);

  function setQuery(query) { store.setState({ query: query || '' }); }
  function selectDiscipline(discipline) { store.setState({ selectedDiscipline: discipline || 'all' }); }
  function selectEntry(entryId) { store.setState({ selectedEntryId: entryId }); }
  function toggleFavoritesFilter() { store.setState({ showOnlyFavorites: !store.getState().showOnlyFavorites }); }

  function toggleFavorite(entryId) {
    const current = store.getState().favorites || [];
    const next = current.includes(entryId)
      ? current.filter((id) => id !== entryId)
      : [...current, entryId];
    store.setState({ favorites: next });
  }

  function getResults() {
    const current = store.getState();
    return searchRules({
      query: current.query,
      discipline: current.selectedDiscipline,
      favorites: current.favorites,
      onlyFavorites: current.showOnlyFavorites
    });
  }

  function getSelectedEntry() {
    const current = store.getState();
    const results = getResults();
    if (current.selectedEntryId && results.some((entry) => entry.id === current.selectedEntryId)) {
      return getEntry(current.selectedEntryId);
    }
    return results[0] || null;
  }

  function getStats() {
    return {
      sections: SECTIONS.length,
      quickRules: QUICK_RULES.length,
      favorites: store.getState().favorites.length,
      pages: RULEBOOK_META.pageCount
    };
  }

  return {
    state,
    meta: RULEBOOK_META,
    pdfUrl: OFFICIAL_PDF_URL,
    sections: SECTIONS,
    setQuery,
    selectDiscipline,
    selectEntry,
    toggleFavorite,
    toggleFavoritesFilter,
    getResults,
    getSelectedEntry,
    getStats
  };
}
