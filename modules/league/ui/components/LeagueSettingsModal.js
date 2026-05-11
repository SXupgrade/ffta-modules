import { CpButton } from '../../../../core/ui/components/CpButton.js';
import { MAX_LEAGUE_ROUNDS } from '../../domain/constants/league.constants.js';

/**
 * Opens the league settings modal.
 * Returns the modal controller (with .close()).
 *
 * @param {{ app: Object, vm: Object }} props
 * @returns {{ close: Function }}
 */
export function LeagueSettingsModal({ app, vm } = {}) {
  const settings = vm.state.settings ?? {};

  const roundCodesText = Array.isArray(settings.roundTournamentCodes)
    ? settings.roundTournamentCodes.join('\n')
    : (settings.roundTournamentCodes ?? '');

  const qualGridText = JSON.stringify(settings.qualificationPointsGrid ?? [], null, 2);
  const bracketGridText = JSON.stringify(settings.bracketPointsGrid ?? [], null, 2);

  const pointsModeOptions = [
    { value: 'qualification-ranking', label: app.t('league.settings.qualificationRanking') },
    { value: 'match-wins',            label: app.t('league.settings.matchWins') },
    { value: 'bracket-ranking',       label: app.t('league.settings.bracketRanking') },
    { value: 'combined',              label: app.t('league.settings.combined') }
  ];

  const buildOption = (value, label, selected) =>
    `<option value="${value}"${selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;

  const body = `
    <form id="league-settings-form" class="league-settings-form">
      <div class="ffta-form-group">
        <label for="ls-master">${app.t('league.settings.masterTournament')}</label>
        <input id="ls-master" name="masterTournamentCode" type="text"
               value="${escapeAttr(settings.masterTournamentCode ?? '')}"
               placeholder="e.g. LEAGUE2026">
        <span class="ffta-form-hint">${app.t('league.settings.masterTournamentHint')}</span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-rounds">${app.t('league.settings.roundTournaments')}</label>
        <textarea id="ls-rounds" name="roundTournamentCodes" rows="5"
                  placeholder="ROUND1&#10;ROUND2&#10;ROUND3">${escapeHtml(roundCodesText)}</textarea>
        <span class="ffta-form-hint">${app.t('league.settings.roundTournamentsHint', { max: MAX_LEAGUE_ROUNDS })}</span>
        <span class="ffta-form-error" id="ls-rounds-error"></span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-points-mode">${app.t('league.settings.pointsMode')}</label>
        <select id="ls-points-mode" name="pointsMode">
          ${pointsModeOptions.map((o) => buildOption(o.value, o.label, (settings.pointsMode ?? 'qualification-ranking') === o.value)).join('')}
        </select>
      </div>

      <div class="ffta-form-group">
        <label for="ls-qual-grid">${app.t('league.settings.qualificationPointsGrid')}</label>
        <textarea id="ls-qual-grid" name="qualificationPointsGrid" rows="4">${escapeHtml(qualGridText)}</textarea>
        <span class="ffta-form-hint">${app.t('league.settings.qualificationPointsGridHint')}</span>
        <span class="ffta-form-error" id="ls-qual-grid-error"></span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-match-pts">${app.t('league.settings.matchWinPoints')}</label>
        <input id="ls-match-pts" name="matchWinPoints" type="number" min="0"
               value="${Number(settings.matchWinPoints ?? 1)}">
        <span class="ffta-form-error" id="ls-match-pts-error"></span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-bracket-grid">${app.t('league.settings.bracketPointsGrid')}</label>
        <textarea id="ls-bracket-grid" name="bracketPointsGrid" rows="4">${escapeHtml(bracketGridText)}</textarea>
        <span class="ffta-form-hint">${app.t('league.settings.bracketPointsGridHint')}</span>
        <span class="ffta-form-error" id="ls-bracket-grid-error"></span>
      </div>
    </form>
  `;

  const footer = `
    ${CpButton({ label: app.t('league.actions.cancel'), action: 'cancel-settings', variant: 'secondary' })}
    ${CpButton({ label: app.t('league.actions.save'),   action: 'save-settings',   variant: 'primary' })}
  `;

  const modal = app.modal.open({
    id: 'league-settings-modal',
    title: app.t('league.settings.title'),
    body,
    footer
  });

  // Attach form submit logic after modal is in the DOM
  const form = modal.el.querySelector('#league-settings-form');

  modal.el.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'cancel-settings') {
      modal.close();
      return;
    }

    if (action === 'save-settings') {
      const parsed = parseForm(form, app);
      if (!parsed.valid) return;

      await vm.saveSettings(parsed.settings);
      modal.close();
    }
  });

  return modal;
}

function parseForm(form, app) {
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

  const pointsMode = form.querySelector('[name="pointsMode"]').value;

  let qualGrid = [];
  const qualText = form.querySelector('[name="qualificationPointsGrid"]').value.trim();
  const qualError = form.querySelector('#ls-qual-grid-error');
  try {
    qualGrid = qualText ? JSON.parse(qualText) : [];
    qualError.textContent = '';
  } catch {
    qualError.textContent = app.t('league.settings.invalidJson');
    valid = false;
  }

  const matchWinPointsVal = parseFloat(form.querySelector('[name="matchWinPoints"]').value);
  const matchPtsError = form.querySelector('#ls-match-pts-error');
  if (isNaN(matchWinPointsVal)) {
    matchPtsError.textContent = app.t('league.settings.invalidNumber');
    valid = false;
  } else {
    matchPtsError.textContent = '';
  }

  let bracketGrid = [];
  const bracketText = form.querySelector('[name="bracketPointsGrid"]').value.trim();
  const bracketError = form.querySelector('#ls-bracket-grid-error');
  try {
    bracketGrid = bracketText ? JSON.parse(bracketText) : [];
    bracketError.textContent = '';
  } catch {
    bracketError.textContent = app.t('league.settings.invalidJson');
    valid = false;
  }

  return {
    valid,
    settings: {
      masterTournamentCode:    master,
      roundTournamentCodes:    roundCodes,
      pointsMode,
      qualificationPointsGrid: qualGrid,
      matchWinPoints:          matchWinPointsVal,
      bracketPointsGrid:       bracketGrid,
      groupBy:                 'division-class'
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
