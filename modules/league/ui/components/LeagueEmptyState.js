import { CpEmptyState } from '../../../../core/ui/components/CpEmptyState.js';
import { CpButton } from '../../../../core/ui/components/CpButton.js';

/**
 * @param {{ app: Object, reason?: 'no-config'|'no-results' }} props
 * @returns {string} HTML string
 */
export function LeagueEmptyState({ app, reason = 'no-config' } = {}) {
  const isNoConfig = reason === 'no-config';
  return CpEmptyState({
    icon: isNoConfig ? '⚙️' : '📋',
    title: app.t(isNoConfig ? 'league.emptyState.noConfig' : 'league.emptyState.noResults'),
    detail: app.t(isNoConfig ? 'league.emptyState.noConfigDetail' : 'league.emptyState.noResultsDetail'),
    actions: isNoConfig
      ? CpButton({ label: app.t('league.actions.openSettings'), action: 'openSettings', variant: 'primary' })
      : ''
  });
}
