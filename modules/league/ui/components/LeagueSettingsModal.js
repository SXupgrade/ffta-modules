import { CpButton } from '../../../../core/ui/components/CpButton.js';
import { MAX_LEAGUE_ROUNDS } from '../../domain/constants/league.constants.js';

/**
 * Opens the league binding settings modal.
 * This modal intentionally edits only the master/round binding.
 * Points rules are configured per category from each standings card action menu.
 *
 * @param {{ app: Object, vm: Object }} props
 * @returns {{ close: Function }}
 */
export function LeagueSettingsModal({ app, vm } = {}) {
  const settings = vm.state.settings ?? {};

  const roundCodesText = Array.isArray(settings.roundTournamentCodes)
    ? settings.roundTournamentCodes.join('\n')
    : (settings.roundTournamentCodes ?? '');

  const body = `
    <form id="league-settings-form" class="league-settings-form">
      <div class="ffta-form-group">
        <label for="ls-master">${app.t('league.settings.masterTournament')}</label>
        <input id="ls-master" name="masterTournamentCode" type="text"
               value="${escapeAttr(settings.masterTournamentCode ?? '')}"
               placeholder="e.g. 2026-DR">
        <span class="ffta-form-hint">${app.t('league.settings.masterTournamentHint')}</span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-rounds">${app.t('league.settings.roundTournaments')}</label>
        <textarea id="ls-rounds" name="roundTournamentCodes" rows="6"
                  placeholder="2026-DRA&#10;2026-DRB&#10;2026-DRC">${escapeHtml(roundCodesText)}</textarea>
        <span class="ffta-form-hint">${app.t('league.settings.roundTournamentsHint', { max: MAX_LEAGUE_ROUNDS })}</span>
        <span class="ffta-form-error" id="ls-rounds-error"></span>
      </div>
    </form>
  `;

  const footer = `
    ${CpButton({ label: app.t('league.actions.cancel'), action: 'cancel-settings', variant: 'secondary' })}
    ${CpButton({ label: app.t('league.actions.save'),   action: 'save-settings',   variant: 'primary' })}
  `;

  const modal = app.modal.open({
    id: 'league-settings-modal',
    title: app.t('league.settings.bindingTitle'),
    body,
    footer
  });

  const form = modal.el.querySelector('#league-settings-form');

  modal.el.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'cancel-settings') {
      modal.close();
      return;
    }

    if (action === 'save-settings') {
      const parsed = parseForm(form, app, settings);
      if (!parsed.valid) return;

      await vm.saveSettings(parsed.settings);
      modal.close();
    }
  });

  return modal;
}

function parseForm(form, app, currentSettings) {
  let valid = true;

  const master = form.querySelector('[name="masterTournamentCode"]').value.trim();

  const roundsText = form.querySelector('[name="roundTournamentCodes"]').value;
  const roundCodes = roundsText.split('\n').map((s) => s.trim()).filter(Boolean);
  const roundsError = form.querySelector('#ls-rounds-error');
  if (roundCodes.length > MAX_LEAGUE_ROUNDS) {
    roundsError.textContent = app.t('league.warnings.tooManyRounds', { max: MAX_LEAGUE_ROUNDS });
    valid = false;
  } else {
    roundsError.textContent = '';
  }

  return {
    valid,
    settings: {
      ...currentSettings,
      masterTournamentCode: master,
      roundTournamentCodes: roundCodes,
      groupBy: 'division-class'
    }
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return String(value ?? '').replace(/"/g, '&quot;');
}
