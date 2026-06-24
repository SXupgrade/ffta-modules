export function mountSimpleModulePage({ root, app }) {
  let isMounted = true;
  const state = {
    catalog: null,
    currentProfile: 'ffta-beginner',
    isSaving: false
  };

  render();
  load();

  async function load() {
    try {
      const [catalog, storedProfile] = await Promise.all([
        loadProfileCatalog(),
        app.settings.get('simpleMenu.profile', 'ffta-beginner')
      ]);
      if (!isMounted) return;
      state.catalog = catalog;
      state.currentProfile = normalizeProfileId(storedProfile, catalog.defaultProfile || 'ffta-beginner');
      render();
    } catch (error) {
      console.error('[simple-menu] Failed to load profiles', error);
      if (app?.notify?.error) app.notify.error(app.t('simpleMenu.errors.loadFailed'));
    }
  }

  async function loadProfileCatalog() {
    const response = await fetch(new URL('../../profiles/index.json', import.meta.url).href, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Profile catalog HTTP ${response.status}`);
    }
    return response.json();
  }

  function normalizeProfileId(value, fallback) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  }

  function render() {
    const catalog = state.catalog || { profiles: [], defaultProfile: 'ffta-beginner' };
    const profiles = Array.isArray(catalog.profiles) ? catalog.profiles : [];
    const currentProfile = state.currentProfile || catalog.defaultProfile || 'ffta-beginner';
    const selectedProfile = profiles.find((profile) => profile.id === currentProfile);

    root.innerHTML = `
      <section class="ffta-page simple-menu-page">
        <div class="ffta-page__header">
          <div>
            <h1>${escapeHtml(app.t('simpleMenu.title'))}</h1>
            <p class="ffta-muted">${escapeHtml(app.t('simpleMenu.description'))}</p>
          </div>
        </div>

        <div class="cp-card simple-menu-card">
          <h2>${escapeHtml(app.t('simpleMenu.profile.title'))}</h2>
          <p class="ffta-muted">${escapeHtml(app.t('simpleMenu.profile.help'))}</p>

          <label class="simple-menu-field" for="simple-menu-profile">
            <span>${escapeHtml(app.t('simpleMenu.profile.selectorLabel'))}</span>
            <select id="simple-menu-profile" data-role="profile-select" ${state.isSaving ? 'disabled' : ''}>
              ${profiles.map((profile) => `
                <option value="${escapeAttr(profile.id)}" ${profile.id === currentProfile ? 'selected' : ''}>
                  ${escapeHtml(profile.label || profile.id)}
                </option>
              `).join('')}
            </select>
          </label>

          <div class="simple-menu-profile-preview">
            <strong>${escapeHtml(selectedProfile?.label || currentProfile)}</strong>
            <p>${escapeHtml(selectedProfile?.description || app.t('simpleMenu.profile.noDescription'))}</p>
            <code>profiles/${escapeHtml(currentProfile)}.json</code>
          </div>

          <div class="simple-menu-actions">
            <button type="button" class="cp-button cp-button--primary" data-action="save-profile" ${state.isSaving ? 'disabled' : ''}>
              ${escapeHtml(state.isSaving ? app.t('simpleMenu.actions.saving') : app.t('simpleMenu.actions.saveProfile'))}
            </button>
          </div>
        </div>

        <div class="cp-card simple-menu-card simple-menu-note">
          <h2>${escapeHtml(app.t('simpleMenu.status.title'))}</h2>
          <p>${escapeHtml(app.t('simpleMenu.status.enabled'))}</p>
          <p class="ffta-muted">${escapeHtml(app.t('simpleMenu.status.reload'))}</p>
        </div>
      </section>
    `;

    root.querySelector('[data-role="profile-select"]')?.addEventListener('change', (event) => {
      state.currentProfile = event.target.value;
      render();
    });

    root.querySelector('[data-action="save-profile"]')?.addEventListener('click', saveProfile);
  }

  async function saveProfile() {
    try {
      state.isSaving = true;
      render();
      await app.settings.set('simpleMenu.profile', state.currentProfile);
      if (app?.notify?.success) app.notify.success(app.t('simpleMenu.actions.saved'));
    } catch (error) {
      console.error('[simple-menu] Failed to save profile', error);
      if (app?.notify?.error) app.notify.error(app.t('simpleMenu.errors.saveFailed'));
    } finally {
      state.isSaving = false;
      if (isMounted) render();
    }
  }

  return function unmountSimpleMenuPage() {
    isMounted = false;
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
