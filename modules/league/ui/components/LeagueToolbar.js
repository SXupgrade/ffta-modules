import { CpButton } from '../../../../core/ui/components/CpButton.js';

/**
 * @param {{ app: Object, isLoading?: boolean }} props
 * @returns {string} HTML string
 */
export function LeagueToolbar({ app, isLoading = false } = {}) {
  return `
    <div class="league-toolbar ffta-actions">
      ${CpButton({ label: app.t('league.actions.openSettings'), action: 'openSettings', variant: 'secondary' })}
      ${CpButton({ label: app.t('league.actions.recalculate'),  action: 'recalculate',  variant: 'secondary', disabled: isLoading })}
      ${CpButton({ label: app.t('league.actions.exportPdf'),    action: 'exportPdf',    variant: 'secondary' })}
      ${CpButton({ label: app.t('league.actions.exportCsv'),    action: 'exportCsv',    variant: 'secondary' })}
    </div>
  `;
}
