import { createPlanQualifsViewModel } from '../../application/planQualifs.vm.js';

export function mountPlanQualifsPage({ root, app }) {
  const repository = app.services.get('plan-qualifs.repository');
  const vm = createPlanQualifsViewModel({ app, repository });
  let isMounted = true;
  let draggedTargetNumber = null;
  const unsubscribe = vm.subscribe(render);

  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  root.addEventListener('input', handleInput);
  root.addEventListener('dblclick', handleDoubleClick);
  root.addEventListener('dragstart', handleDragStart);
  root.addEventListener('dragend', handleDragEnd);
  root.addEventListener('dragover', handleDragOver);
  root.addEventListener('dragleave', handleDragLeave);
  root.addEventListener('drop', handleDrop);
  root.addEventListener('mouseover', handleHaloMouseOver);
  root.addEventListener('mouseout', handleHaloMouseOut);

  vm.load();

  function render(state) {
    if (!isMounted) return;

    root.innerHTML = `
      <section class="ffta-page plan-qualifs-page">
        <div class="plan-qualifs-toolbar cp-card">
          <div>
            <h2>${escapeHtml(app.t('plan-qualifs.title'))}</h2>
            <p>${escapeHtml(state.session?.label || app.t('plan-qualifs.description'))}</p>
          </div>
          <div class="plan-qualifs-toolbar__controls">
            ${renderSessionSelect(state)}
            ${renderGroupingSelect(state)}
            <label class="plan-qualifs-check"><input type="checkbox" data-action="toggle-archers" ${state.showArchers ? 'checked' : ''}> ${escapeHtml(app.t('plan-qualifs.toggles.showArchers'))}</label>
            <label class="plan-qualifs-check"><input type="checkbox" data-action="toggle-assigned" ${state.showAssigned ? 'checked' : ''}> ${escapeHtml(app.t('plan-qualifs.toggles.showAssigned'))}</label>
            <button type="button" class="cp-button" data-action="reload">${escapeHtml(app.t('plan-qualifs.actions.reload'))}</button>
            <button type="button" class="cp-button" data-action="print">${escapeHtml(app.t('plan-qualifs.actions.printTargets'))}</button>
            <button type="button" class="cp-button" data-action="global-recap">${escapeHtml(app.t('plan-qualifs.actions.globalRecap'))}</button>
            <button type="button" class="cp-button" data-action="order-faces">${escapeHtml(app.t('plan-qualifs.actions.orderFaces'))}</button>
            <button type="button" class="cp-button" data-action="new-archer">${escapeHtml(app.t('plan-qualifs.actions.newArcher'))}</button>
            <button type="button" class="cp-button cp-button--danger" data-action="clear-session">${escapeHtml(app.t('plan-qualifs.actions.clearSession'))}</button>
          </div>
        </div>

        ${state.error ? `<div class="ffta-badge ffta-badge--error">${escapeHtml(String(state.error.message || state.error))}</div>` : ''}
        ${state.isLoading && !state.session ? `<div class="cp-card"><span class="cp-loader__spinner"></span> ${escapeHtml(app.t('plan-qualifs.loading'))}</div>` : ''}
        ${state.isSaving ? `<div class="plan-qualifs-saving">${escapeHtml(app.t('plan-qualifs.saving'))}</div>` : ''}

        ${state.session ? `
          <div class="plan-qualifs-print-cover">
            <h2>${escapeHtml(state.context?.tournamentName || '')}</h2>
            <p>${escapeHtml(state.session?.label || '')}</p>
            <h3>${escapeHtml(app.t('plan-qualifs.print.faceSummary'))}</h3>
            ${renderPrintFaceSummary(state.recap)}
          </div>

          <div class="plan-qualifs-recap cp-card">
            <strong>${escapeHtml(app.t('plan-qualifs.recap.faces'))}</strong>
            <div class="plan-qualifs-recap__items">${renderRecap(state.recap)}</div>
          </div>

          <div class="plan-qualifs-layout">
            <aside class="plan-qualifs-picking cp-card">
              <div class="plan-qualifs-search">
                <input type="search" data-action="search" placeholder="${escapeHtml(app.t('plan-qualifs.search.placeholder'))}" value="${escapeHtml(state.search)}">
              </div>
              ${renderPickingGroups(state)}
            </aside>
            <div class="plan-qualifs-targets">
              ${renderTargets(state)}
            </div>
          </div>
        ` : renderEmptyState()}

        ${renderOrderModal(state)}
        ${renderPopEditModal()}
      </section>`;
  }

  function renderSessionSelect(state) {
    return `<label class="plan-qualifs-field"><span>${escapeHtml(app.t('plan-qualifs.fields.session'))}</span><select data-action="session">${state.sessions.map((session) => `<option value="${session.id}" ${Number(session.id) === Number(state.sessionId) ? 'selected' : ''}>${escapeHtml(session.name)}</option>`).join('')}</select></label>`;
  }

  function renderGroupingSelect(state) {
    return `<label class="plan-qualifs-field"><span>${escapeHtml(app.t('plan-qualifs.fields.grouping'))}</span><select data-action="grouping"><option value="0" ${Number(state.grouping) === 0 ? 'selected' : ''}>${escapeHtml(app.t('plan-qualifs.grouping.face'))}</option><option value="1" ${Number(state.grouping) === 1 ? 'selected' : ''}>${escapeHtml(app.t('plan-qualifs.grouping.category'))}</option></select></label>`;
  }

  function renderRecap(recap) {
    if (!recap.length) return `<span class="plan-qualifs-muted">${escapeHtml(app.t('plan-qualifs.recap.none'))}</span>`;
    return recap.map((face) => `<span class="plan-qualifs-face-pill" data-face-label="${escapeAttribute(face.displayName)}"><img src="${escapeAttribute(face.svgUrl)}" alt=""> ${escapeHtml(face.displayName)} <strong>${face.physicalCount}</strong></span>`).join('');
  }

  function renderPrintFaceSummary(recap) {
    if (!recap.length) return `<p>${escapeHtml(app.t('plan-qualifs.recap.none'))}</p>`;
    return `<table class="plan-qualifs-print-table"><thead><tr><th>${escapeHtml(app.t('plan-qualifs.order.face'))}</th><th>${escapeHtml(app.t('plan-qualifs.order.archersPerFace'))}</th><th>${escapeHtml(app.t('plan-qualifs.order.quantity'))}</th></tr></thead><tbody>${recap.map((face) => `<tr><td><img src="${escapeAttribute(face.svgUrl)}" alt=""> ${escapeHtml(face.displayName)}</td><td>${face.imgNbArcher || ''}</td><td>${face.physicalCount}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderPickingGroups(state) {
    const filteredParticipants = filterParticipants([...state.participants, ...state.unassigned], state);
    const groups = [...state.groups, { id: 'unassigned', type: 'unassigned', label: app.t('plan-qualifs.groups.unassigned') }];

    return groups.map((group) => {
      const items = group.type === 'unassigned'
        ? filteredParticipants.filter((participant) => participant.isUnassigned || !participant.isAssigned)
        : filteredParticipants.filter((participant) => matchesGroup(participant, group));
      const affected = items.filter((participant) => participant.isAssigned).length;
      return `
        <details class="plan-qualifs-group" open data-highlight-type="${escapeAttribute(group.type)}" data-highlight-value="${escapeAttribute(group.type === 'category' ? group.category : group.blasonAlias || '')}" data-highlight-distance="${escapeAttribute(group.distance || '')}">
          <summary>${escapeHtml(group.label)} <span>(${affected}/${items.length})</span></summary>
          <div class="plan-qualifs-group__items" data-drop-unassigned="${group.type === 'unassigned' ? '1' : '0'}">
            ${items.length ? items.map((participant) => renderParticipantChip(participant, state)).join('') : `<p class="plan-qualifs-muted">${escapeHtml(app.t('plan-qualifs.groups.empty'))}</p>`}
          </div>
        </details>`;
    }).join('');
  }

  function renderParticipantChip(participant, state) {
    const hiddenClass = (!state.showAssigned && participant.isAssigned) ? ' plan-qualifs-chip--hidden' : '';
    return `
      <div class="plan-qualifs-chip${hiddenClass}" draggable="true" data-participant-id="${participant.id}" data-struct-id="${participant.structId}" data-category="${escapeAttribute(participant.category)}" data-face-label="${escapeAttribute(participant.blason?.displayName || '')}" data-distance="${escapeAttribute(participant.distance || '')}">
        <button type="button" class="plan-qualifs-chip__remove" data-action="unassign" data-participant-id="${participant.id}" title="${escapeHtml(app.t('plan-qualifs.actions.unassign'))}">×</button>
        <button type="button" class="plan-qualifs-chip__delete" data-action="delete-archer" data-participant-id="${participant.id}" data-participant-name="${escapeAttribute(participant.shortName)}" title="${escapeHtml(app.t('plan-qualifs.actions.deleteArcher'))}">🗑</button>
        <strong>${escapeHtml(participant.category)} — ${escapeHtml(participant.shortName)}</strong>
        <span>${escapeHtml(participant.structName || '')}</span>
        <small>${escapeHtml(participant.license || '')}${participant.targetLabel ? ` · ${escapeHtml(participant.targetLabel)}` : ''}</small>
      </div>`;
  }

  function renderTargets(state) {
    if (!state.targets.length) return `<div class="cp-card">${escapeHtml(app.t('plan-qualifs.empty.noTargets'))}</div>`;
    return `<div class="plan-qualifs-target-grid" id="targetsArea">${state.targets.map((target) => renderTarget(target, state)).join('')}</div>`;
  }

  function renderTarget(target, state) {
    const statusKey = warnStatusKey(target.warnLevel);
    const statusLabel = app.t(`plan-qualifs.status.${statusKey}`);
    const warningLabel = target.warnMessage || statusLabel;
    return `
      <article class="plan-qualifs-target plan-qualifs-target--${statusKey}" data-target-card="1" data-target-number="${target.number}" data-status="${escapeAttribute(statusKey)}">
        <div class="plan-qualifs-target__status">${escapeHtml(statusLabel)}</div>
        <header class="plan-qualifs-target__header">
          <button type="button" class="plan-qualifs-target__move" draggable="true" data-drag-target="${target.number}" title="${escapeHtml(app.t('plan-qualifs.actions.moveTarget'))}">☷</button>
          <strong>${escapeHtml(app.t('plan-qualifs.target.label', { number: target.number }))}</strong>
          <span>${target.distance?.value ? `(${target.distance.value}m)` : ''}</span>
          <button type="button" class="plan-qualifs-target__clear" data-action="clear-target" data-target-number="${target.number}" title="${escapeHtml(app.t('plan-qualifs.actions.clearTarget'))}">×</button>
        </header>
        <div class="plan-qualifs-target__column-labels">
          <span>A/C</span>
          <span>B/D</span>
        </div>
        ${warningLabel && statusKey !== 'free' && statusKey !== 'full' ? `<div class="plan-qualifs-target__warning">${escapeHtml(warningLabel)}</div>` : ''}
        <div class="plan-qualifs-target__faces plan-qualifs-target__faces--${escapeAttribute(resolveTargetFaceLayout(target))}">${renderTargetFaces(target)}</div>
        <div class="plan-qualifs-slots ${state.showArchers ? '' : 'plan-qualifs-slots--faces-only'}">
          ${renderTargetColumns(target).map((column) => `<div class="plan-qualifs-slot-column">${column.map((slot) => renderSlot(slot, target)).join('')}</div>`).join('')}
        </div>
      </article>`;
  }

  function renderTargetFaces(target) {
    const columns = renderTargetColumns(target);
    if (!columns.some((column) => column.some((slot) => slot.blason))) {
      return `<span class="plan-qualifs-muted">${escapeHtml(app.t('plan-qualifs.target.free'))}</span>`;
    }
    return columns.map((column, columnIndex) => {
      const faces = column.filter((slot) => slot.blason).map((slot) => renderFaceMarker(slot, columnIndex));
      return `<div class="plan-qualifs-face-column" data-face-column="${columnIndex + 1}">${faces.join('')}</div>`;
    }).join('');
  }

  function renderFaceMarker(slot, columnIndex) {
    const face = slot.blason;
    if (!face) return '';
    const participant = slot.participant;
    const size = Math.max(18, Math.min(Number(face.imgSize || 40), 64));
    const isOverlay = slot.overlay ? ' plan-qualifs-face-marker--overlay' : '';
    return `<span class="plan-qualifs-face-marker${isOverlay}" data-face-label="${escapeAttribute(face.displayName)}" data-face-key="${escapeAttribute(face.physicalCompatKey || face.displayName)}" data-category="${escapeAttribute(participant?.category || '')}" data-struct-id="${escapeAttribute(participant?.structId || '')}" data-distance="${escapeAttribute(participant?.distance || '')}"><img src="${escapeAttribute(face.svgUrl)}" title="${escapeAttribute(face.displayName)}" alt="${escapeAttribute(face.displayName)}" style="width:${size}px;height:${size}px"><small>${escapeHtml(face.label || face.displayName)}</small></span>`;
  }

  function renderSlot(slot, target) {
    const participant = slot.participant;
    const face = slot.blason;
    return `
      <div class="plan-qualifs-slot ${participant ? 'plan-qualifs-slot--filled' : ''} ${slot.overlay ? 'plan-qualifs-slot--overlay' : ''}" data-target-number="${target.number}" data-slot-order="${slot.order}" data-slot-label="${escapeAttribute(slot.label)}" data-struct-id="${escapeAttribute(participant?.structId || '')}" data-category="${escapeAttribute(participant?.category || '')}" data-face-label="${escapeAttribute(face?.displayName || '')}" data-face-key="${escapeAttribute(face?.physicalCompatKey || face?.displayName || '')}" data-distance="${escapeAttribute(participant?.distance || '')}">
        <span class="plan-qualifs-slot__letter">${escapeHtml(slot.label)}</span>
        ${participant ? `<div class="plan-qualifs-slot__archer" draggable="true" data-participant-id="${participant.id}" data-struct-id="${participant.structId}" data-category="${escapeAttribute(participant.category)}" data-face-label="${escapeAttribute(participant.blason?.displayName || '')}" data-face-key="${escapeAttribute(participant.blason?.physicalCompatKey || participant.blason?.displayName || '')}" data-distance="${escapeAttribute(participant.distance || '')}"><strong>${escapeHtml(participant.shortName)}</strong><small>${escapeHtml(participant.category)} · ${escapeHtml(participant.structName || '')}</small></div>` : `<span class="plan-qualifs-muted">${escapeHtml(app.t('plan-qualifs.target.dropHere'))}</span>`}
      </div>`;
  }

  function renderTargetColumns(target) {
    const slots = target.slots || [];
    const ac = slots.filter((slot) => ['A', 'C', 'E', 'G'].includes(String(slot.label)) || [1, 3, 5, 7].includes(Number(slot.order)));
    const bd = slots.filter((slot) => ['B', 'D', 'F', 'H'].includes(String(slot.label)) || [2, 4, 6, 8].includes(Number(slot.order)));
    if (target.layout === 'three-archer-h1v2') {
      const a = slots.filter((slot) => String(slot.label) === 'A');
      const b = slots.filter((slot) => String(slot.label) === 'B');
      const c = slots.filter((slot) => String(slot.label) === 'C');
      return [b, [...a, ...c]];
    }
    return [ac, bd];
  }

  function resolveTargetFaceLayout(target) {
    if (target.layout === 'three-archer-h1v2') return 'three';
    const realFaces = (target.slots || []).filter((slot) => slot.blason && !slot.overlay).map((slot) => slot.blason);
    if (realFaces.some((face) => Number(face.imgNbArcher || 0) >= 4 || Number(face.imgSize || 0) >= 80)) return 'large';
    if (realFaces.some((face) => Number(face.imgNbArcher || 0) === 1)) return 'single';
    return 'columns';
  }

  function renderOrderModal(state) {
    const rows = state.recap.length ? state.recap : [];
    const total = rows.reduce((sum, face) => sum + computeOrderTotal(face.displayName, face.physicalCount, getAutoCoeff(face.displayName)), 0);
    return `
      <div class="plan-qualifs-modal" data-modal="order" hidden>
        <div class="plan-qualifs-modal__panel">
          <header><h3>${escapeHtml(app.t('plan-qualifs.order.title'))}</h3><button type="button" data-action="close-modal">×</button></header>
          <div class="plan-qualifs-order-actions">
            <button type="button" class="cp-button" data-action="add-order-row">${escapeHtml(app.t('plan-qualifs.order.addRow'))}</button>
            <button type="button" class="cp-button" data-action="copy-order">${escapeHtml(app.t('plan-qualifs.order.copy'))}</button>
          </div>
          <table class="plan-qualifs-order-table">
            <thead><tr><th>${escapeHtml(app.t('plan-qualifs.order.face'))}</th><th>${escapeHtml(app.t('plan-qualifs.order.quantity'))}</th><th>${escapeHtml(app.t('plan-qualifs.order.coefficient'))}</th><th>${escapeHtml(app.t('plan-qualifs.order.total'))}</th></tr></thead>
            <tbody>
              ${(rows.length ? rows : [{ displayName: '', physicalCount: 0 }]).map((face) => renderOrderRow(face.displayName, face.physicalCount, getAutoCoeff(face.displayName))).join('')}
            </tbody>
            <tfoot><tr><td colspan="3">${escapeHtml(app.t('plan-qualifs.order.grandTotal'))}</td><td data-order-grand-total>${total}</td></tr></tfoot>
          </table>
        </div>
      </div>`;
  }

  function renderOrderRow(face, quantity, coefficient) {
    const total = computeOrderTotal(face, quantity, coefficient);
    return `<tr data-order-row><td><input type="text" data-order-field="face" value="${escapeAttribute(face || '')}"></td><td><input type="number" min="0" step="1" data-order-field="quantity" value="${Number(quantity) || 0}"></td><td><input type="number" min="0" step="1" data-order-field="coefficient" value="${Number(coefficient) || 1}"></td><td data-order-total>${total}</td></tr>`;
  }

  function renderPopEditModal() {
    return `
      <div class="plan-qualifs-modal" data-modal="pop-edit" hidden>
        <div class="plan-qualifs-modal__panel plan-qualifs-modal__panel--wide">
          <header><h3>${escapeHtml(app.t('plan-qualifs.edit.title'))}</h3><button type="button" data-action="close-pop-edit">×</button></header>
          <iframe class="plan-qualifs-popedit-frame" title="${escapeAttribute(app.t('plan-qualifs.edit.title'))}" src="about:blank"></iframe>
        </div>
      </div>`;
  }

  function renderEmptyState() {
    return `<div class="cp-empty-state"><h3>${escapeHtml(app.t('plan-qualifs.empty.title'))}</h3><p>${escapeHtml(app.t('plan-qualifs.empty.description'))}</p></div>`;
  }

  function filterParticipants(participants, state) {
    const query = normalizeSearch(state.search);
    return participants.filter((participant, index, all) => {
      if (all.findIndex((item) => Number(item.id) === Number(participant.id)) !== index) return false;
      if (!query) return true;
      const haystack = normalizeSearch(`${participant.shortName} ${participant.firstName} ${participant.lastName} ${participant.license} ${participant.structName} ${participant.category} ${participant.targetLabel}`);
      return haystack.includes(query);
    });
  }

  function matchesGroup(participant, group) {
    if (group.type === 'category') return participant.category === group.category;
    if (group.type === 'face') {
      const sameFace = participant.blason?.displayName === group.blasonAlias;
      const sameDistance = !group.distance || Number(participant.distance) === Number(group.distance);
      return sameFace && sameDistance;
    }
    return false;
  }

  function handleHaloMouseOver(event) {
    const source = event.target.closest('[data-struct-id], [data-category], [data-face-label]');
    if (!source || !root.contains(source)) return;
    const structId = source.dataset.structId || '';
    const category = source.dataset.category || '';
    const faceLabel = source.dataset.faceLabel || '';
    const distance = source.dataset.distance || '';
    applyHalo({ structId, category, faceLabel, distance });
  }

  function handleHaloMouseOut(event) {
    const source = event.target.closest('[data-struct-id], [data-category], [data-face-label]');
    if (!source || (event.relatedTarget && source.contains(event.relatedTarget))) return;
    clearHalo();
  }

  function applyHalo({ structId, category, faceLabel, distance }) {
    clearHalo();
    if (structId) root.querySelectorAll(`[data-struct-id="${cssEscape(structId)}"]`).forEach((item) => item.classList.add('plan-qualifs-halo--club'));
    if (category) root.querySelectorAll(`[data-category="${cssEscape(category)}"]`).forEach((item) => item.classList.add('plan-qualifs-halo--category'));
    if (faceLabel) root.querySelectorAll(`[data-face-label="${cssEscape(faceLabel)}"]`).forEach((item) => item.classList.add('plan-qualifs-halo--face'));
    if (distance) root.querySelectorAll(`[data-distance="${cssEscape(distance)}"]`).forEach((item) => item.classList.add('plan-qualifs-halo--distance'));
  }

  function clearHalo() {
    root.querySelectorAll('.plan-qualifs-halo--club,.plan-qualifs-halo--category,.plan-qualifs-halo--face,.plan-qualifs-halo--distance')
      .forEach((item) => item.classList.remove('plan-qualifs-halo--club', 'plan-qualifs-halo--category', 'plan-qualifs-halo--face', 'plan-qualifs-halo--distance'));
  }

  async function handleClick(event) {
    const element = event.target.closest('[data-action]');
    if (!element) return;
    const action = element.dataset.action;
    if (action === 'reload') vm.reload();
    if (action === 'print') window.print();
    if (action === 'global-recap') openGlobalRecap();
    if (action === 'order-faces') openModal('order');
    if (action === 'new-archer') openPopEdit(0);
    if (action === 'close-modal') closeModal(element.closest('[data-modal]'));
    if (action === 'close-pop-edit') closePopEdit();
    if (action === 'add-order-row') addOrderRow();
    if (action === 'copy-order') copyOrder();
    if (action === 'clear-target') {
      const targetNumber = Number(element.dataset.targetNumber);
      if (window.confirm(app.t('plan-qualifs.confirm.clearTarget'))) vm.clearTarget(targetNumber);
    }
    if (action === 'clear-session') {
      if (window.confirm(app.t('plan-qualifs.confirm.clearSession'))) vm.clearSession();
    }
    if (action === 'unassign') {
      vm.moveArcher({ participantId: Number(element.dataset.participantId), targetNumber: 0, slotOrder: 0 });
    }
    if (action === 'delete-archer') {
      const participantId = Number(element.dataset.participantId);
      const name = element.dataset.participantName || `#${participantId}`;
      if (window.confirm(app.t('plan-qualifs.confirm.deleteArcher', { name }))) vm.deleteArcher(participantId);
    }
  }

  function handleChange(event) {
    const action = event.target?.dataset?.action;
    if (action === 'session') vm.changeSession(event.target.value);
    if (action === 'grouping') vm.changeGrouping(event.target.value);
    if (action === 'toggle-archers') vm.setShowArchers(event.target.checked);
    if (action === 'toggle-assigned') vm.setShowAssigned(event.target.checked);
    if (event.target?.dataset?.orderField) updateOrderTotals();
  }

  function handleInput(event) {
    if (event.target?.dataset?.action === 'search') vm.setSearch(event.target.value);
    if (event.target?.dataset?.orderField) updateOrderTotals();
  }

  function handleDoubleClick(event) {
    const archer = event.target.closest('[data-participant-id]');
    if (!archer) return;
    openPopEdit(Number(archer.dataset.participantId));
  }

  function handleDragStart(event) {
    const targetHandle = event.target.closest('[data-drag-target]');
    if (targetHandle) {
      draggedTargetNumber = Number(targetHandle.dataset.dragTarget);
      event.dataTransfer.setData('application/x-ffta-target', String(draggedTargetNumber));
      event.dataTransfer.effectAllowed = 'move';
      targetHandle.closest('[data-target-card]')?.classList.add('plan-qualifs-target--dragging');
      return;
    }

    const chip = event.target.closest('[data-participant-id]');
    if (!chip) return;
    event.dataTransfer.setData('text/plain', chip.dataset.participantId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    draggedTargetNumber = null;
    root.querySelectorAll('.plan-qualifs-target--dragging,.plan-qualifs-target--drop').forEach((item) => item.classList.remove('plan-qualifs-target--dragging', 'plan-qualifs-target--drop'));
  }

  function handleDragOver(event) {
    const targetCard = event.target.closest('[data-target-card]');
    if (draggedTargetNumber && targetCard) {
      event.preventDefault();
      targetCard.classList.add('plan-qualifs-target--drop');
      return;
    }
    if (event.target.closest('[data-target-number][data-slot-order], [data-drop-unassigned="1"]')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDragLeave(event) {
    const targetCard = event.target.closest('[data-target-card]');
    if (targetCard && !targetCard.contains(event.relatedTarget)) {
      targetCard.classList.remove('plan-qualifs-target--drop');
    }
  }

  function handleDrop(event) {
    const targetCard = event.target.closest('[data-target-card]');
    if (draggedTargetNumber && targetCard) {
      event.preventDefault();
      const destinationTarget = Number(targetCard.dataset.targetNumber);
      if (destinationTarget && destinationTarget !== draggedTargetNumber) {
        vm.moveTarget({ sourceTarget: draggedTargetNumber, destinationTarget });
      }
      return;
    }

    const participantId = Number(event.dataTransfer.getData('text/plain'));
    if (!participantId) return;
    const unassignedDrop = event.target.closest('[data-drop-unassigned="1"]');
    if (unassignedDrop) {
      event.preventDefault();
      vm.moveArcher({ participantId, targetNumber: 0, slotOrder: 0 });
      return;
    }
    const slot = event.target.closest('[data-target-number][data-slot-order]');
    if (!slot) return;
    event.preventDefault();
    vm.moveArcher({ participantId, targetNumber: Number(slot.dataset.targetNumber), slotOrder: Number(slot.dataset.slotOrder) });
  }

  async function openGlobalRecap() {
    try {
      const payload = await vm.getGlobalRecap();
      const win = window.open('', '_blank', 'width=1000,height=720');
      if (!win) return;
      win.document.write(buildGlobalRecapDocument(payload, vm.state.context));
      win.document.close();
      win.focus();
      win.onload = () => win.print();
    } catch (error) {
      app.notify.error(app.t('plan-qualifs.errors.loadFailed'));
    }
  }

  function buildGlobalRecapDocument(payload, context) {
    const sessions = payload.sessions || [];
    const rows = payload.rows || [];
    const title = escapeHtml(context?.tournamentName || app.t('plan-qualifs.recap.globalTitle'));
    const header = `<tr><th>${escapeHtml(app.t('plan-qualifs.order.face'))}</th>${sessions.map((session) => `<th>${escapeHtml(session.label)}</th>`).join('')}<th>Total</th></tr>`;
    const body = rows.map((row) => `<tr><td><img src="${escapeAttribute(row.svgUrl)}" alt=""> ${escapeHtml(row.label)}</td>${sessions.map((session) => `<td class="num">${row.sessions?.[session.id] || '—'}</td>`).join('')}<td class="num strong">${row.total || 0}</td></tr>`).join('');
    const totals = sessions.map((session) => rows.reduce((sum, row) => sum + Number(row.sessions?.[session.id] || 0), 0));
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;margin:1cm;font-size:11pt}h2{border-bottom:2px solid #111;padding-bottom:.25cm}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:5px 8px}th{background:#eee}.num{text-align:center}.strong{font-weight:bold}img{max-width:42px;max-height:42px;vertical-align:middle;margin-right:8px}@media print{@page{margin:1cm}}</style></head><body><h2>${title}<br><small>${escapeHtml(app.t('plan-qualifs.recap.globalTitle'))}</small></h2><table><thead>${header}</thead><tbody>${body}<tr><td class="strong">Total</td>${totals.map((value) => `<td class="num strong">${value}</td>`).join('')}<td class="num strong">${totals.reduce((sum, value) => sum + value, 0)}</td></tr></tbody></table></body></html>`;
  }

  function openModal(name) {
    const modal = root.querySelector(`[data-modal="${name}"]`);
    if (modal) modal.hidden = false;
  }

  function closeModal(modal) {
    if (modal) modal.hidden = true;
  }

  function openPopEdit(participantId) {
    const state = vm.state;
    const modal = root.querySelector('[data-modal="pop-edit"]');
    const frame = modal?.querySelector('iframe');
    const baseUrl = state.context?.popEditUrl || new URL('../../../Partecipants/PopEdit.php', app.runtime.baseUrl).href;
    if (!modal || !frame) return;
    const url = new URL(baseUrl, window.location.href);
    url.searchParams.set('id', String(participantId || 0));
    url.searchParams.set('ses', String(state.sessionId || 1));
    url.searchParams.set('tar', '');
    frame.src = url.href;
    frame.onload = () => {
      try {
        frame.contentWindow.opener = null;
        frame.contentWindow.close = () => closePopEdit();
      } catch {}
    };
    modal.hidden = false;
  }

  function closePopEdit() {
    const modal = root.querySelector('[data-modal="pop-edit"]');
    const frame = modal?.querySelector('iframe');
    if (frame) frame.src = 'about:blank';
    if (modal) modal.hidden = true;
    vm.reload();
  }

  function addOrderRow() {
    const tbody = root.querySelector('.plan-qualifs-order-table tbody');
    if (!tbody) return;
    tbody.insertAdjacentHTML('beforeend', renderOrderRow('', 0, 1));
    updateOrderTotals();
  }

  function updateOrderTotals() {
    let total = 0;
    root.querySelectorAll('[data-order-row]').forEach((row) => {
      const face = row.querySelector('[data-order-field="face"]')?.value || '';
      const quantity = Number(row.querySelector('[data-order-field="quantity"]')?.value || 0);
      const coefficient = Number(row.querySelector('[data-order-field="coefficient"]')?.value || 0);
      const rowTotal = computeOrderTotal(face, quantity, coefficient);
      const cell = row.querySelector('[data-order-total]');
      if (cell) cell.textContent = String(rowTotal);
      total += rowTotal;
    });
    const grandTotal = root.querySelector('[data-order-grand-total]');
    if (grandTotal) grandTotal.textContent = String(total);
  }

  async function copyOrder() {
    const rows = [...root.querySelectorAll('[data-order-row]')].map((row) => [
      row.querySelector('[data-order-field="face"]')?.value || '',
      row.querySelector('[data-order-field="quantity"]')?.value || '0',
      row.querySelector('[data-order-field="coefficient"]')?.value || '0',
      row.querySelector('[data-order-total]')?.textContent || '0'
    ].join('\t'));
    const text = [
      `${app.t('plan-qualifs.order.face')}\t${app.t('plan-qualifs.order.quantity')}\t${app.t('plan-qualifs.order.coefficient')}\t${app.t('plan-qualifs.order.total')}`,
      ...rows,
      `${app.t('plan-qualifs.order.grandTotal')}\t\t\t${root.querySelector('[data-order-grand-total]')?.textContent || '0'}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      app.notify.success(app.t('plan-qualifs.order.copied'));
    } catch {
      window.prompt(app.t('plan-qualifs.order.copyFallback'), text);
    }
  }

  return () => {
    isMounted = false;
    unsubscribe?.();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('change', handleChange);
    root.removeEventListener('input', handleInput);
    root.removeEventListener('dblclick', handleDoubleClick);
    root.removeEventListener('dragstart', handleDragStart);
    root.removeEventListener('dragend', handleDragEnd);
    root.removeEventListener('dragover', handleDragOver);
    root.removeEventListener('dragleave', handleDragLeave);
    root.removeEventListener('drop', handleDrop);
    root.removeEventListener('mouseover', handleHaloMouseOver);
    root.removeEventListener('mouseout', handleHaloMouseOut);
  };
}

function getAutoCoeff(face) {
  const normalized = String(face || '').toLowerCase().trim();
  if (!normalized) return 1;
  if (normalized.includes('trispot co')) return 5;
  if (normalized.includes('40')) return 2;
  return 1;
}

function isBundleBy4(face) {
  const normalized = String(face || '').toLowerCase().trim();
  return normalized.includes('60cm unique') || normalized.includes('80cm unique');
}

function computeOrderTotal(face, quantity, coefficient) {
  const normalizedQuantity = isBundleBy4(face) ? Math.ceil((Number(quantity) || 0) / 4) : (Number(quantity) || 0);
  return Math.round(normalizedQuantity * (Number(coefficient) || 0));
}

function warnStatusKey(level) {
  return ['free', 'full', 'majority', 'single', 'mixed-distance', 'incompatible-face', 'duplicate-slot'][Number(level)] || 'free';
}

function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
