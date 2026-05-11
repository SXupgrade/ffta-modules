import { LeagueHeader } from '../components/LeagueHeader.js';
import { LeagueToolbar } from '../components/LeagueToolbar.js';
import { LeagueRoundsPanel } from '../components/LeagueRoundsPanel.js';
import { LeagueStandingsTable } from '../components/LeagueStandingsTable.js';
import { LeagueWarningsPanel } from '../components/LeagueWarningsPanel.js';
import { LeagueSettingsModal } from '../components/LeagueSettingsModal.js';
import { LeagueEmptyState } from '../components/LeagueEmptyState.js';
import { CpLoader } from '../../../../core/ui/components/CpLoader.js';

/**
 * Mount LeaguePage into a root DOM element and return an unmount function.
 *
 * @param {{ root: HTMLElement, vm: Object, app: Object }} params
 * @returns {Function} unmount
 */
export function mountLeaguePage({ root, vm, app }) {
  let unsubscribe;

  function render() {
    root.innerHTML = buildHtml(vm.state, app, vm);
  }

  function handleAction(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'recalculate':
        vm.recalculate();
        break;
      case 'exportPdf':
        vm.exportPdf();
        break;
      case 'exportCsv':
        exportCsv(vm, app);
        break;
      case 'openSettings':
        LeagueSettingsModal({ app, vm });
        break;
    }
  }

  unsubscribe = vm.state.__store
    ? vm.state.__store.subscribe(render)
    : null;

  root.addEventListener('click', handleAction);
  render();

  // Initial data load
  vm.load().catch(() => {});

  return function unmount() {
    if (unsubscribe) unsubscribe();
    root.removeEventListener('click', handleAction);
  };
}

function buildHtml(state, app, vm) {
  const settings    = state.settings ?? {};
  const rounds      = (state.standings.length > 0 || state.isLoading)
    ? buildRoundsFromSettings(settings)
    : buildRoundsFromSettings(settings);

  const isConfigured = Boolean(settings.masterTournamentCode);
  const hasResults   = state.standings.length > 0;

  let body;
  if (state.isLoading) {
    body = CpLoader({ label: app.t('league.messages.calculating') });
  } else if (!isConfigured) {
    body = LeagueEmptyState({ app, reason: 'no-config' });
  } else if (!hasResults && state.warnings.some((w) => w.level !== 'info')) {
    body = `
      ${LeagueWarningsPanel({ app, warnings: state.warnings })}
      ${LeagueEmptyState({ app, reason: 'no-results' })}
    `;
  } else {
    body = `
      ${LeagueWarningsPanel({ app, warnings: state.warnings })}
      ${LeagueStandingsTable({ app, groups: state.standings, rounds })}
    `;
  }

  const masterName = settings.masterTournamentCode ?? '';

  return `
    <section class="ffta-page league-page">
      ${LeagueHeader({ title: app.t('league.title'), masterName })}
      <div class="league-page__meta">
        ${LeagueRoundsPanel({ app, rounds, settings })}
        ${LeagueToolbar({ app, isLoading: state.isLoading })}
      </div>
      ${state.error ? `<div class="league-error ffta-badge ffta-badge--error">${escapeHtml(String(state.error))}</div>` : ''}
      <div class="league-page__body">
        ${body}
      </div>
      ${state.calculatedAt
        ? `<p class="ffta-muted ffta-small">${escapeHtml(new Date(state.calculatedAt).toLocaleString())}</p>`
        : ''}
    </section>
  `;
}

function buildRoundsFromSettings(settings) {
  const codes = Array.isArray(settings.roundTournamentCodes)
    ? settings.roundTournamentCodes
    : [];
  return codes.map((code, i) => ({ code, index: i + 1, name: code, found: true }));
}

function exportCsv(vm, app) {
  const rows = [];
  for (const group of vm.state.standings) {
    for (const row of (group.rows ?? [])) {
      rows.push({
        category: group.groupKey,
        rank:      row.rank,
        team:      row.teamName ?? row.teamCode,
        total:     row.totalPoints
      });
    }
  }
  app.exports.csv('team-championship-standings.csv', rows);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
