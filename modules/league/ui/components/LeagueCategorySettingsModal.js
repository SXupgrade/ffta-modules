import { CpButton } from '../../../../core/ui/components/CpButton.js';

const DEFAULT_CATEGORY_SETTINGS = Object.freeze({
  enableQualificationPoints: false,
  enableMatchWinPoints: false,
  enableBracketPoints: false,
  qualificationPointsGrid: [],
  matchWinPoints: 0,
  bracketPointsGrid: []
});

/**
 * Opens the per-category points settings modal.
 *
 * @param {{ app: Object, vm: Object, group: Object }} props
 * @returns {{ close: Function }}
 */
export function LeagueCategorySettingsModal({ app, vm, group } = {}) {
  const categoryKey = group?.groupKey ?? '';
  const settings = vm.state.settings ?? {};
  const current = {
    ...DEFAULT_CATEGORY_SETTINGS,
    enableQualificationPoints: isLegacyModeEnabled(settings, 'qualification-ranking'),
    enableMatchWinPoints: isLegacyModeEnabled(settings, 'match-wins'),
    enableBracketPoints: isLegacyModeEnabled(settings, 'bracket-ranking'),
    qualificationPointsGrid: settings.qualificationPointsGrid ?? [],
    matchWinPoints: settings.matchWinPoints ?? 0,
    bracketPointsGrid: settings.bracketPointsGrid ?? [],
    ...(settings.categoryPointSettings?.[categoryKey] ?? {})
  };

  const body = `
    <form id="league-category-settings-form" class="league-settings-form league-category-settings-form" data-category-key="${escapeAttr(categoryKey)}">
      <p class="ffta-muted">${app.t('league.categorySettings.detail', { category: categoryKey })}</p>

      <div class="league-mode-checks">
        ${renderCheckbox(app, 'enableQualificationPoints', 'league.categorySettings.enableQualificationPoints', current.enableQualificationPoints)}
        ${renderCheckbox(app, 'enableMatchWinPoints', 'league.categorySettings.enableMatchWinPoints', current.enableMatchWinPoints)}
        ${renderCheckbox(app, 'enableBracketPoints', 'league.categorySettings.enableBracketPoints', current.enableBracketPoints)}
      </div>

      <section class="league-category-section" data-section="qualification">
        <h3>${app.t('league.categorySettings.qualificationGrid')}</h3>
        ${renderPointsGrid(app, 'qualificationPointsGrid', current.qualificationPointsGrid)}
      </section>

      <section class="league-category-section" data-section="match-wins">
        <h3>${app.t('league.categorySettings.matchWins')}</h3>
        <div class="ffta-form-group">
          <label for="lcs-match-points">${app.t('league.categorySettings.matchWinPoints')}</label>
          <input id="lcs-match-points" name="matchWinPoints" type="number" min="0" value="${Number(current.matchWinPoints ?? 0)}">
          <span class="ffta-form-error" id="lcs-match-points-error"></span>
        </div>
      </section>

      <section class="league-category-section" data-section="bracket">
        <h3>${app.t('league.categorySettings.bracketGrid')}</h3>
        ${renderPointsGrid(app, 'bracketPointsGrid', current.bracketPointsGrid)}
      </section>
    </form>
  `;

  const footer = `
    ${CpButton({ label: app.t('league.actions.cancel'), action: 'cancel-category-settings', variant: 'secondary' })}
    ${CpButton({ label: app.t('league.actions.save'),   action: 'save-category-settings',   variant: 'primary' })}
  `;

  const modal = app.modal.open({
    id: `league-category-settings-modal-${categoryKey}`,
    title: app.t('league.categorySettings.title', { category: categoryKey }),
    body,
    footer
  });

  const form = modal.el.querySelector('#league-category-settings-form');
  bindCategorySettingsForm(form);

  modal.el.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'cancel-category-settings') {
      modal.close();
      return;
    }

    if (action === 'add-grid-row') {
      const table = event.target.closest('[data-grid]');
      const tbody = table?.querySelector('tbody');
      if (tbody) tbody.insertAdjacentHTML('beforeend', renderGridRow('', ''));
      return;
    }

    if (action === 'remove-grid-row') {
      event.target.closest('tr')?.remove();
      return;
    }

    if (action === 'save-category-settings') {
      const parsed = parseCategoryForm(form, app);
      if (!parsed.valid) return;

      const nextCategorySettings = {
        ...(settings.categoryPointSettings ?? {}),
        [categoryKey]: parsed.settings
      };

      await vm.saveSettings({
        ...settings,
        categoryPointSettings: nextCategorySettings
      });
      modal.close();
    }
  });

  return modal;
}

function bindCategorySettingsForm(form) {
  const syncVisibility = () => {
    const qualificationEnabled = form.querySelector('[name="enableQualificationPoints"]')?.checked;
    const matchEnabled = form.querySelector('[name="enableMatchWinPoints"]')?.checked;
    const bracketEnabled = form.querySelector('[name="enableBracketPoints"]')?.checked;
    form.querySelector('[data-section="qualification"]')?.classList.toggle('is-hidden', !qualificationEnabled);
    form.querySelector('[data-section="match-wins"]')?.classList.toggle('is-hidden', !matchEnabled);
    form.querySelector('[data-section="bracket"]')?.classList.toggle('is-hidden', !bracketEnabled);
  };

  form.addEventListener('change', (event) => {
    if (event.target.matches('input[type="checkbox"]')) syncVisibility();
  });
  syncVisibility();
}

function parseCategoryForm(form, app) {
  let valid = true;
  const matchWinPoints = Number(form.querySelector('[name="matchWinPoints"]')?.value ?? 0);
  const matchError = form.querySelector('#lcs-match-points-error');
  if (Number.isNaN(matchWinPoints) || matchWinPoints < 0) {
    valid = false;
    if (matchError) matchError.textContent = app.t('league.settings.invalidNumber');
  } else if (matchError) {
    matchError.textContent = '';
  }

  return {
    valid,
    settings: {
      enableQualificationPoints: Boolean(form.querySelector('[name="enableQualificationPoints"]')?.checked),
      enableMatchWinPoints: Boolean(form.querySelector('[name="enableMatchWinPoints"]')?.checked),
      enableBracketPoints: Boolean(form.querySelector('[name="enableBracketPoints"]')?.checked),
      qualificationPointsGrid: readPointsGrid(form, 'qualificationPointsGrid'),
      matchWinPoints,
      bracketPointsGrid: readPointsGrid(form, 'bracketPointsGrid')
    }
  };
}

function renderCheckbox(app, name, labelKey, checked) {
  return `
    <label class="league-check-row">
      <input type="checkbox" name="${name}"${checked ? ' checked' : ''}>
      <span>${app.t(labelKey)}</span>
    </label>
  `;
}

function renderPointsGrid(app, name, rows = []) {
  const safeRows = rows.length > 0 ? rows : [{ rank: 1, points: 0 }];
  return `
    <table class="league-points-grid" data-grid="${name}">
      <thead>
        <tr>
          <th>${app.t('league.categorySettings.rank')}</th>
          <th>${app.t('league.categorySettings.points')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${safeRows.map((row) => renderGridRow(row.rank, row.points)).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">
            <button type="button" class="cp-button cp-button--secondary" data-action="add-grid-row">${app.t('league.categorySettings.addRow')}</button>
          </td>
        </tr>
      </tfoot>
    </table>
  `;
}

function renderGridRow(rank, points) {
  return `
    <tr>
      <td><input type="number" min="1" data-grid-field="rank" value="${escapeAttr(rank)}"></td>
      <td><input type="number" min="0" data-grid-field="points" value="${escapeAttr(points)}"></td>
      <td><button type="button" class="cp-button cp-button--secondary" data-action="remove-grid-row">×</button></td>
    </tr>
  `;
}

function readPointsGrid(form, name) {
  const table = form.querySelector(`[data-grid="${name}"]`);
  const rows = [];
  for (const tr of table?.querySelectorAll('tbody tr') ?? []) {
    const rank = Number(tr.querySelector('[data-grid-field="rank"]')?.value ?? 0);
    const points = Number(tr.querySelector('[data-grid-field="points"]')?.value ?? 0);
    if (rank > 0 && !Number.isNaN(points)) {
      rows.push({ rank, points: Math.max(0, points) });
    }
  }
  rows.sort((a, b) => a.rank - b.rank);
  return rows;
}

function escapeAttr(value) {
  return String(value ?? '').replace(/"/g, '&quot;');
}


function isLegacyModeEnabled(settings, mode) {
  const pointsMode = settings?.pointsMode ?? '';
  if (!pointsMode) return false;
  if (pointsMode === 'combined') return true;
  if (mode === 'qualification-ranking') return pointsMode === 'qualification-ranking';
  if (mode === 'match-wins') return pointsMode === 'match-wins';
  if (mode === 'bracket-ranking') return pointsMode === 'bracket-ranking';
  return false;
}
