import { CpButton } from '../../../../core/ui/components/CpButton.js';
import { MAX_LEAGUE_ROUNDS } from '../../domain/constants/league.constants.js';

/**
 * Opens the league round binding settings modal.
 * The master tournament is always the tournament currently opened in Ianseo.
 * This modal therefore only edits the linked round tournaments.
 *
 * @param {{ app: Object, vm: Object }} props
 * @returns {{ close: Function }}
 */
export function LeagueSettingsModal({ app, vm } = {}) {
  const settings = vm.state.settings ?? {};
  const masterTournament = vm.state.masterTournament ?? null;
  const availableTournaments = vm.state.availableTournaments ?? [];
  const currentMasterCode = settings.masterTournamentCode ?? masterTournament?.code ?? '';
  const selectedRoundCodes = Array.isArray(settings.roundTournamentCodes)
    ? settings.roundTournamentCodes
    : [];

  const body = `
    <form id="league-settings-form" class="league-settings-form">
      <div class="ffta-form-group league-current-master">
        <label>${app.t('league.settings.currentMasterTournament')}</label>
        <div class="league-current-master__value">
          <strong>${escapeHtml(currentMasterCode || app.t('league.settings.noCurrentTournament'))}</strong>
          ${masterTournament?.name ? `<span class="ffta-muted">${escapeHtml(masterTournament.name)}</span>` : ''}
        </div>
        <span class="ffta-form-hint">${app.t('league.settings.currentMasterTournamentHint')}</span>
      </div>

      <div class="ffta-form-group">
        <label>${app.t('league.settings.roundTournaments')}</label>
        <div class="league-round-select-list">
          ${Array.from({ length: MAX_LEAGUE_ROUNDS }, (_, index) => renderRoundSelect({
            app,
            index,
            selectedCode: selectedRoundCodes[index] ?? '',
            tournaments: availableTournaments,
            currentMasterCode
          })).join('')}
        </div>
        <span class="ffta-form-hint">${app.t('league.settings.roundTournamentsSelectHint', { max: MAX_LEAGUE_ROUNDS })}</span>
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

function renderRoundSelect({ app, index, selectedCode, tournaments, currentMasterCode }) {
  const label = app.t('league.rounds.round', { index: index + 1 });
  const options = [
    `<option value="">${escapeHtml(app.t('league.settings.noRoundSelected'))}</option>`,
    ...tournaments.map((tournament) => {
      const code = tournament.code ?? '';
      const isCurrentMaster = currentMasterCode && code === currentMasterCode;
      const selected = code === selectedCode ? ' selected' : '';
      const disabled = isCurrentMaster ? ' disabled' : '';
      const labelText = `${code} — ${tournament.name || code}${isCurrentMaster ? ` (${app.t('league.settings.currentTournamentBadge')})` : ''}`;
      return `<option value="${escapeAttr(code)}"${selected}${disabled}>${escapeHtml(labelText)}</option>`;
    })
  ].join('');

  return `
    <label class="league-round-select-row">
      <span>${escapeHtml(label)}</span>
      <select name="roundTournamentCodes" data-round-index="${index + 1}">${options}</select>
    </label>
  `;
}

function parseForm(form, app, currentSettings) {
  let valid = true;

  const selects = Array.from(form.querySelectorAll('[name="roundTournamentCodes"]'));
  const roundCodes = selects
    .map((select) => select.value.trim())
    .filter(Boolean);

  const uniqueCodes = Array.from(new Set(roundCodes));
  const roundsError = form.querySelector('#ls-rounds-error');

  if (uniqueCodes.length > MAX_LEAGUE_ROUNDS) {
    roundsError.textContent = app.t('league.warnings.tooManyRounds', { max: MAX_LEAGUE_ROUNDS });
    valid = false;
  } else if (uniqueCodes.length !== roundCodes.length) {
    roundsError.textContent = app.t('league.settings.duplicateRound');
    valid = false;
  } else {
    roundsError.textContent = '';
  }

  return {
    valid,
    settings: {
      ...currentSettings,
      roundTournamentCodes: uniqueCodes,
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
