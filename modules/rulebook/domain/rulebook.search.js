import { QUICK_RULES, SECTIONS } from '../data/rulebook.index.js';

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function searchRules({ query = '', discipline = 'all', favorites = [], onlyFavorites = false } = {}) {
  const normalizedQuery = normalizeSearchText(query).trim();
  const favoriteSet = new Set(favorites);

  return QUICK_RULES
    .filter((entry) => discipline === 'all' || entry.discipline === discipline || entry.section === discipline)
    .filter((entry) => !onlyFavorites || favoriteSet.has(entry.id))
    .map((entry) => ({ ...entry, score: scoreEntry(entry, normalizedQuery), isFavorite: favoriteSet.has(entry.id) }))
    .filter((entry) => !normalizedQuery || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.page - b.page || a.title.localeCompare(b.title));
}

export function getSection(sectionId) {
  return SECTIONS.find((section) => section.id === sectionId) || SECTIONS[0];
}

export function getEntry(entryId) {
  return QUICK_RULES.find((entry) => entry.id === entryId) || QUICK_RULES[0];
}

function scoreEntry(entry, normalizedQuery) {
  if (!normalizedQuery) return 1;
  const haystack = normalizeSearchText([
    entry.title,
    entry.article,
    entry.summary,
    entry.sourceHint,
    ...(entry.tags || [])
  ].join(' '));

  let score = 0;
  for (const token of normalizedQuery.split(/\s+/).filter(Boolean)) {
    if (normalizeSearchText(entry.title).includes(token)) score += 8;
    if (normalizeSearchText(entry.article).includes(token)) score += 5;
    if ((entry.tags || []).some((tag) => normalizeSearchText(tag).includes(token))) score += 4;
    if (haystack.includes(token)) score += 1;
  }
  return score;
}
