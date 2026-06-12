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
        <input id="ls-master" name="masterTournamentCode" type="text" list="ls-tournaments-list"
               value="${escapeAttr(settings.masterTournamentCode ?? '')}"
               placeholder="2026-DR">
        <span class="ffta-form-hint" id="ls-master-hint">${app.t('league.settings.tournamentsLoading')}</span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-rounds">${app.t('league.settings.roundTournaments')}</label>
        <textarea id="ls-rounds" name="roundTournamentCodes" rows="6"
                  placeholder="2026-DRA&#10;2026-DRB&#10;2026-DRC">${escapeHtml(roundCodesText)}</textarea>
        <span class="ffta-form-hint">${app.t('league.settings.roundTournamentsHint', { max: MAX_LEAGUE_ROUNDS })}</span>
        <span class="ffta-form-error" id="ls-rounds-error"></span>
      </div>

      <div class="ffta-form-group">
        <label for="ls-add-round">${app.t('league.settings.addRound')}</label>
        <div class="ffta-actions">
          <input id="ls-add-round" type="text" list="ls-tournaments-list" placeholder="2026-DRA">
          <button type="button" class="cp-btn cp-btn--secondary" data-action="add-round">${app.t('league.settings.addRoundAction')}</button>
        </div>
      </div>

      <datalist id="ls-tournaments-list"></datalist>
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

  // UX v0.2.14 : selection au lieu de saisie. Les tournois existants sont
  // proposes dans une liste (datalist) pour le tournoi principal et les
  // manches — plus d'erreur de frappe sur les codes. La saisie libre reste
  // possible si la liste ne charge pas.
  populateTournamentList({ app, vm, modal });

  modal.el.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'add-round') {
      const picker = modal.el.querySelector('#ls-add-round');
      const textarea = form.querySelector('[name="roundTournamentCodes"]');
      const code = extractTournamentCode(picker?.value);
      if (code && textarea) {
        const existing = textarea.value.split('\n').map((line) => line.trim()).filter(Boolean);
        if (!existing.includes(code)) {
          textarea.value = [...existing, code].join('\n');
        }
        picker.value = '';
      }
      return;
    }

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

  const master = extractTournamentCode(form.querySelector('[name="masterTournamentCode"]').value);

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

async function populateTournamentList({ app, vm, modal }) {
  const datalist = modal.el.querySelector('#ls-tournaments-list');
  const hint = modal.el.querySelector('#ls-master-hint');
  if (!datalist) return;
  const tournaments = typeof vm.listTournaments === 'function' ? await vm.listTournaments() : [];
  if (!modal.el.isConnected) return;
  datalist.innerHTML = tournaments.map((tournament) => {
    const code = escapeAttr(tournament.code ?? '');
    const name = tournament.name ? ` \u2014 ${tournament.name}` : '';
    const date = tournament.date ? ` (${String(tournament.date).slice(0, 10)})` : '';
    return `<option value="${code}" label="${escapeAttr(`${tournament.code}${name}${date}`)}"></option>`;
  }).join('');
  if (hint) hint.textContent = app.t('league.settings.masterTournamentHint');
}

/** Accepte « CODE » ou « CODE \u2014 Nom (date) » et retourne le code seul. */
function extractTournamentCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return raw.split('\u2014')[0].split(' (')[0].trim();
}
