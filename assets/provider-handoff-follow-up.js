import { MEDICATION_OPTIONS, TEMPORARY_TREATMENT_PRESETS, buildProviderHandoffUpdate, extractInstructionDetails, isValidDateString, localDateString, normalizeReason, parseAvsLocally, parseProviderHandoffJson, proposeMedicationActions, reconcileMedicationActions, resolveMedicationForReview, temporaryTreatmentFromPreset, upgradeProviderHandoff, validateProviderTemporaryTreatment, validateResolvedProposals, } from './provider-handoff-core.js';
const ACTION_OPTIONS = [
    { value: '', label: 'Choose action' },
    { value: 'start', label: 'Start' },
    { value: 'continue', label: 'Continue' },
    { value: 'stop', label: 'Stop' },
    { value: 'restart', label: 'Restart' },
    { value: 'dose_change', label: 'Change dose' },
    { value: 'hold', label: 'Hold temporarily' },
    { value: 'never_started', label: 'Never started' },
];
const ACTION_LABELS = {
    start: 'START',
    continue: 'CONTINUE',
    stop: 'STOP',
    restart: 'RESTART',
    dose_change: 'DOSE CHANGE',
    hold: 'HOLD',
    never_started: 'NEVER STARTED',
};
function byId(id) {
    return document.getElementById(id);
}
const newTab = byId('workflow-new-tab');
const followUpTab = byId('workflow-followup-tab');
const newWorkflow = byId('new-handoff-workflow');
const followUpWorkflow = byId('followup-handoff-workflow');
const fileInput = byId('followup-handoff-file');
const fileName = byId('followup-file-name');
const handoffText = byId('followup-handoff-text');
const loadButton = byId('load-followup-handoff');
const loadStatus = byId('followup-load-status');
const avsPanel = byId('followup-avs-panel');
const loadedSummary = byId('loaded-handoff-summary');
const encounterDate = byId('followup-encounter-date');
const avsText = byId('followup-avs-text');
const reviewButton = byId('review-followup-changes');
const clearHandoffButton = byId('clear-followup-handoff');
const parseStatus = byId('followup-parse-status');
const reviewPanel = byId('followup-review-panel');
const changeCount = byId('followup-change-count');
const notices = byId('followup-review-notices');
const changeList = byId('followup-change-list');
const addManualButton = byId('add-manual-followup-change');
const addTemporaryButton = byId('add-followup-temporary-treatment');
const temporaryList = byId('followup-temporary-treatment-list');
const readyTitle = byId('followup-ready-title');
const readyDetail = byId('followup-ready-detail');
const applyButton = byId('apply-followup-changes');
const applyStatus = byId('followup-apply-status');
const exportPanel = byId('followup-export-panel');
const exportButton = byId('export-updated-handoff');
const copyButton = byId('copy-updated-handoff');
const exportStatus = byId('followup-export-status');
const updatedPreview = byId('followup-json-preview');
let pendingFileText = '';
let loadedHandoff = null;
let reconciliation = null;
let updatedHandoff = null;
const temporaryTreatments = [];
const expandedRows = new Set();
function setStatus(target, message, kind) {
    if (!target)
        return;
    target.textContent = message;
    target.classList.remove('is-ok', 'is-warn', 'is-error');
    if (kind)
        target.classList.add(`is-${kind}`);
}
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function switchWorkflow(workflow) {
    const isNew = workflow === 'new';
    if (newWorkflow)
        newWorkflow.hidden = !isNew;
    if (followUpWorkflow)
        followUpWorkflow.hidden = isNew;
    newTab?.classList.toggle('is-active', isNew);
    followUpTab?.classList.toggle('is-active', !isNew);
    newTab?.setAttribute('aria-selected', String(isNew));
    followUpTab?.setAttribute('aria-selected', String(!isNew));
    if (!isNew)
        followUpWorkflow?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function clearLoadedHandoff() {
    loadedHandoff = null;
    pendingFileText = '';
    if (fileInput)
        fileInput.value = '';
    if (fileName)
        fileName.textContent = 'No file chosen';
    if (handoffText)
        handoffText.value = '';
    if (loadedSummary)
        loadedSummary.textContent = 'No prior file needed';
    if (clearHandoffButton)
        clearHandoffButton.hidden = true;
    setStatus(loadStatus, 'Current handoff removed. Ember will create the update from today’s approved instructions only.', 'ok');
}
async function readSelectedFile(file) {
    pendingFileText = await file.text();
    if (fileName)
        fileName.textContent = file.name;
    setStatus(loadStatus, 'File ready. Use it for cross-checks when you are ready.', 'ok');
}
function openHandoff() {
    const raw = handoffText?.value.trim() || pendingFileText.trim();
    if (!raw) {
        setStatus(loadStatus, 'Choose a current handoff file or paste its complete handoff text.', 'error');
        return;
    }
    try {
        loadedHandoff = upgradeProviderHandoff(parseProviderHandoffJson(raw));
        if (handoffText)
            handoffText.value = '';
        pendingFileText = '';
        const plan = loadedHandoff.patientPlan;
        const activeCount = (plan.preventiveMedications?.length ?? 0) + (plan.acuteMedications?.length ?? 0);
        if (loadedSummary)
            loadedSummary.textContent = `${activeCount} current medication${activeCount === 1 ? '' : 's'}`;
        if (clearHandoffButton)
            clearHandoffButton.hidden = false;
        setStatus(loadStatus, 'Current handoff added for cross-checks. The exported update will still contain only approved changes.', 'ok');
    }
    catch (error) {
        setStatus(loadStatus, error instanceof Error ? error.message : 'This handoff could not be opened.', 'error');
    }
}
function proposedInstruction(proposal) {
    return proposal.instruction
        ?? [proposal.newDose?.raw, proposal.frequency, proposal.route].filter(Boolean).join(' · ');
}
function reasonText(proposal) {
    return proposal.reason?.text ?? '';
}
function rowSummary(proposal) {
    const details = [proposedInstruction(proposal), reasonText(proposal) ? `Reason: ${reasonText(proposal)}` : '']
        .filter(Boolean);
    return details.join(' · ');
}
function effectForAction(action) {
    if (action === 'continue')
        return 'Keep current medication state. No history change.';
    if (action === 'stop')
        return 'End the current record on the encounter date and preserve history.';
    if (action === 'start')
        return 'Add to the current plan on the encounter date.';
    if (action === 'restart')
        return 'Begin a new active episode and preserve earlier history.';
    if (action === 'dose_change')
        return 'Update the current instructions and preserve the prior dose.';
    if (action === 'hold')
        return 'Mark temporarily held without a permanent stop.';
    return 'Record that this medication was never started.';
}
function confidenceLabel(proposal) {
    if (proposal.ignored)
        return 'IGNORED';
    if (proposal.resolved && proposal.confidence !== 'high')
        return 'RESOLVED';
    return proposal.confidence.toUpperCase();
}
function renderActionOptions(selected) {
    return ACTION_OPTIONS.map(option => (`<option value="${option.value}"${option.value === (selected ?? '') ? ' selected' : ''}>${escapeHtml(option.label)}</option>`)).join('');
}
function renderMedicationDatalist() {
    if (document.getElementById('followup-medication-options'))
        return;
    const list = document.createElement('datalist');
    list.id = 'followup-medication-options';
    list.innerHTML = MEDICATION_OPTIONS.map(option => (`<option value="${escapeHtml(option.displayName)}">${escapeHtml(option.kind === 'acute' ? 'As-needed medication' : 'Preventive medication')}</option>`)).join('');
    document.body.appendChild(list);
}
function temporaryPresetOptions(selectedId) {
    return TEMPORARY_TREATMENT_PRESETS.map(preset => (`<option value="${escapeHtml(preset.id)}"${preset.id === selectedId ? ' selected' : ''}>${escapeHtml(preset.label)}</option>`)).join('') + `<option value="custom"${selectedId === 'custom' ? ' selected' : ''}>Something else</option>`;
}
function temporaryScheduleOptions(selected) {
    const options = [
        ['as_directed', 'As directed'],
        ['one_time', 'One time'],
        ['once_daily', 'Once daily'],
        ['twice_daily', 'Twice daily'],
        ['three_times_daily', 'Three times daily'],
        ['taper', 'Taper'],
    ];
    return options.map(([value, label]) => (`<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`)).join('');
}
function renderTemporaryTreatments() {
    if (!temporaryList)
        return;
    temporaryList.innerHTML = temporaryTreatments.map((entry, index) => `
    <article class="temporary-treatment-row" data-followup-temporary-index="${index}">
      <div class="temporary-treatment-row-head">
        <strong>Temporary treatment ${index + 1}</strong>
        <button class="btn-ghost btn-compact" type="button" data-remove-followup-temporary="${index}">Remove</button>
      </div>
      <div class="temporary-treatment-grid">
        <label class="field">
          <span class="field-label">Treatment</span>
          <select class="input" data-followup-temporary-preset="${index}">${temporaryPresetOptions(entry.presetId)}</select>
        </label>
        <label class="field">
          <span class="field-label">Name</span>
          <input class="input" data-followup-temporary-title="${index}" value="${escapeHtml(entry.plan.title)}" />
        </label>
        <label class="field">
          <span class="field-label">Start</span>
          <input class="input input-date" data-followup-temporary-start="${index}" type="date" value="${escapeHtml(entry.plan.plannedStartDate)}" />
        </label>
        <label class="field">
          <span class="field-label">End</span>
          <input class="input input-date" data-followup-temporary-end="${index}" type="date" value="${escapeHtml(entry.plan.plannedEndDate)}" />
        </label>
        <label class="field">
          <span class="field-label">Schedule</span>
          <select class="input" data-followup-temporary-schedule="${index}">${temporaryScheduleOptions(entry.plan.schedule)}</select>
        </label>
      </div>
    </article>
  `).join('');
}
function addTemporaryTreatment() {
    const startDate = encounterDate?.value || localDateString();
    const plan = temporaryTreatmentFromPreset('steroid_pack', startDate);
    if (!plan)
        return;
    temporaryTreatments.push({ presetId: 'steroid_pack', plan });
    renderTemporaryTreatments();
    updateReadiness();
}
function updateTemporaryTreatment(index, field, value) {
    const entry = temporaryTreatments[index];
    if (!entry)
        return;
    if (field === 'preset') {
        entry.presetId = value;
        if (value === 'custom') {
            entry.plan = {
                title: '',
                kind: 'other',
                components: [{ kind: 'other', labelSnapshot: '' }],
                plannedStartDate: entry.plan.plannedStartDate || encounterDate?.value || localDateString(),
                plannedEndDate: entry.plan.plannedStartDate || encounterDate?.value || localDateString(),
                schedule: 'as_directed',
            };
        }
        else {
            const replacement = temporaryTreatmentFromPreset(value, entry.plan.plannedStartDate || localDateString());
            if (replacement)
                entry.plan = replacement;
        }
        renderTemporaryTreatments();
    }
    else if (field === 'title') {
        entry.plan.title = value;
        entry.plan.components = [{
                kind: entry.plan.kind === 'procedure' ? 'procedure' : 'other',
                labelSnapshot: value,
            }];
    }
    else if (field === 'start') {
        const replacement = entry.presetId !== 'custom'
            ? temporaryTreatmentFromPreset(entry.presetId, value)
            : null;
        if (replacement)
            entry.plan = replacement;
        else
            entry.plan.plannedStartDate = value;
        renderTemporaryTreatments();
    }
    else if (field === 'end')
        entry.plan.plannedEndDate = value;
    else if (field === 'schedule')
        entry.plan.schedule = value;
    updateReadiness();
}
function renderProposal(proposal) {
    const expanded = expandedRows.has(proposal.id) || (!proposal.resolved && !proposal.ignored);
    const medicationLabel = proposal.medication?.displayName || proposal.medicationText || 'Medication needs review';
    const actionLabel = proposal.action ? ACTION_LABELS[proposal.action] : 'ACTION NEEDED';
    const summary = rowSummary(proposal);
    const kind = proposal.medication?.kind ?? proposal.medicationAlternatives?.[0]?.kind ?? 'preventive';
    const confidenceClass = proposal.ignored ? 'ignored' : proposal.confidence;
    return `
    <article class="change-row ${expanded ? 'is-expanded' : ''} ${proposal.ignored ? 'is-ignored' : ''}" data-change-id="${escapeHtml(proposal.id)}">
      <div class="change-row-head">
        <div class="change-symbol change-symbol--${escapeHtml(proposal.action ?? 'review')}" aria-hidden="true">${proposal.action === 'stop' ? '−' : proposal.action === 'continue' ? '✓' : proposal.action === 'hold' ? 'Ⅱ' : proposal.action === 'never_started' ? '○' : '+'}</div>
        <div class="change-primary">
          <div class="change-label-line">
            <span class="change-action">${escapeHtml(actionLabel)}</span>
            <span class="confidence-badge confidence-badge--${confidenceClass}">${escapeHtml(confidenceLabel(proposal))}</span>
          </div>
          <strong>${escapeHtml(medicationLabel)}</strong>
          ${summary ? `<span class="change-summary">${escapeHtml(summary)}</span>` : ''}
        </div>
        <div class="change-row-actions">
          ${proposal.ignored
        ? `<button class="btn-ghost btn-compact" type="button" data-change-restore="${escapeHtml(proposal.id)}">Restore</button>`
        : `<button class="btn-ghost btn-compact" type="button" data-change-edit="${escapeHtml(proposal.id)}">${expanded ? 'Close edit' : 'Edit'}</button>
               <button class="btn-ghost btn-compact" type="button" data-change-ignore="${escapeHtml(proposal.id)}">Remove</button>`}
        </div>
      </div>
      ${proposal.issue && !proposal.ignored ? `<div class="needs-help"><strong>Ember needs your help</strong><span>${escapeHtml(proposal.issue)}</span></div>` : ''}
      ${proposal.sourceText && !proposal.ignored ? `<blockquote class="source-instruction">${escapeHtml(proposal.sourceText)}</blockquote>` : ''}
      ${!proposal.ignored ? `<p class="change-effect">${escapeHtml(proposal.effect)}</p>` : ''}
      <div class="change-editor" ${expanded && !proposal.ignored ? '' : 'hidden'}>
        <div class="editor-grid">
          <label class="field">
            <span class="field-label">Medication</span>
            <input class="input" data-edit-medication="${escapeHtml(proposal.id)}" list="followup-medication-options" value="${escapeHtml(medicationLabel === 'Medication needs review' ? '' : medicationLabel)}" placeholder="Search or enter medication" />
          </label>
          <label class="field">
            <span class="field-label">Medication type</span>
            <select class="input" data-edit-kind="${escapeHtml(proposal.id)}">
              <option value="preventive"${kind === 'preventive' ? ' selected' : ''}>Preventive</option>
              <option value="acute"${kind === 'acute' ? ' selected' : ''}>As-needed</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Action</span>
            <select class="input" data-edit-action="${escapeHtml(proposal.id)}">${renderActionOptions(proposal.action)}</select>
          </label>
          <label class="field">
            <span class="field-label">Dose / instructions <span>optional</span></span>
            <input class="input" data-edit-instruction="${escapeHtml(proposal.id)}" value="${escapeHtml(proposedInstruction(proposal))}" placeholder="60 mg once daily" />
          </label>
          <label class="field field-wide">
            <span class="field-label">Reason <span>optional</span></span>
            <input class="input" data-edit-reason="${escapeHtml(proposal.id)}" value="${escapeHtml(reasonText(proposal))}" placeholder="Lack of efficacy" />
          </label>
        </div>
        <div class="editor-actions">
          <button class="btn-secondary" type="button" data-change-use="${escapeHtml(proposal.id)}">Use this change</button>
          <button class="btn-ghost" type="button" data-change-ignore="${escapeHtml(proposal.id)}">Ignore this instruction</button>
        </div>
        <p class="editor-error" data-editor-error="${escapeHtml(proposal.id)}" role="status"></p>
      </div>
    </article>
  `;
}
function updateReadiness() {
    if (!reconciliation || !applyButton || !readyTitle || !readyDetail)
        return;
    const proposals = reconciliation.proposals;
    const unresolved = proposals.filter(item => !item.resolved && !item.ignored).length;
    const selected = proposals.filter(item => item.selected && !item.ignored).length;
    const temporaryCount = temporaryTreatments.length;
    const validationErrors = [
        ...validateResolvedProposals(proposals),
        ...temporaryTreatments.flatMap(item => validateProviderTemporaryTreatment(item.plan)),
    ];
    const canApply = unresolved === 0
        && validationErrors.length === 0
        && (selected > 0 || temporaryCount > 0);
    applyButton.disabled = !canApply;
    if (unresolved > 0) {
        readyTitle.textContent = `${unresolved} instruction${unresolved === 1 ? '' : 's'} still need${unresolved === 1 ? 's' : ''} review`;
        readyDetail.textContent = 'Resolve or ignore each one. No update has been created.';
    }
    else if (selected === 0 && temporaryCount === 0 && reconciliation.notices.some(item => item.kind === 'no_change')) {
        readyTitle.textContent = 'No update needed';
        readyDetail.textContent = 'The instructions say nothing changed, so there is no update file to import.';
    }
    else if (selected > 0 || temporaryCount > 0) {
        const total = selected + temporaryCount;
        readyTitle.textContent = `${total} approved change${total === 1 ? '' : 's'} ready`;
        readyDetail.textContent = 'The update file will include only these reviewed changes.';
    }
    else {
        readyTitle.textContent = 'No changes selected';
        readyDetail.textContent = 'Restore a removed instruction or return to the AVS.';
    }
}
function renderReview() {
    if (!reconciliation || !changeList || !notices || !changeCount)
        return;
    renderMedicationDatalist();
    const count = reconciliation.proposals.length;
    changeCount.textContent = `${count} instruction${count === 1 ? '' : 's'}`;
    notices.innerHTML = reconciliation.notices.map(notice => (`<div class="review-notice review-notice--${escapeHtml(notice.kind)}"><strong>No specific medication change</strong><span>${escapeHtml(notice.text)}</span></div>`)).join('');
    changeList.innerHTML = reconciliation.proposals.map(renderProposal).join('');
    updateReadiness();
}
function reviewChanges() {
    const date = encounterDate?.value ?? '';
    const text = avsText?.value ?? '';
    if (!isValidDateString(date)) {
        setStatus(parseStatus, 'Choose a valid encounter date.', 'error');
        encounterDate?.focus();
        return;
    }
    const parsed = parseAvsLocally(text);
    reconciliation = loadedHandoff
        ? reconcileMedicationActions(loadedHandoff, parsed)
        : proposeMedicationActions(parsed);
    expandedRows.clear();
    reconciliation.proposals.filter(item => !item.resolved).forEach(item => expandedRows.add(item.id));
    renderReview();
    if (reviewPanel)
        reviewPanel.hidden = false;
    if (exportPanel)
        exportPanel.hidden = true;
    const boundaryMessage = !text.trim()
        ? 'No medication instructions were pasted. Add a missed medication change or a temporary treatment below.'
        : parsed.candidates.length === 0 && parsed.notices.length === 0
            ? 'No medication instructions were found. Add a missed change or a temporary treatment below.'
            : parsed.boundary.markerFound
                ? 'The BEGIN EMBER UPDATE boundary was found. Text before it was ignored.'
                : 'No boundary marker was found, so Ember reviewed the entire pasted block.';
    const contextMessage = loadedHandoff
        ? ' The current handoff was used for extra cross-checks.'
        : ' No prior handoff was needed.';
    setStatus(parseStatus, `${boundaryMessage}${contextMessage}`, parsed.candidates.length > 0 || parsed.notices.length > 0 ? 'ok' : 'warn');
    reviewPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function proposalById(id) {
    return reconciliation?.proposals.find(item => item.id === id);
}
function addManualChange() {
    if (!reconciliation)
        return;
    const id = `manual-${Date.now()}-${reconciliation.proposals.length + 1}`;
    reconciliation.proposals.push({
        id,
        medicationText: '',
        confidence: 'unresolved',
        sourceText: '',
        sourceStart: -1,
        sourceEnd: -1,
        issue: 'Enter the medication and choose what changed.',
        selected: false,
        resolved: false,
        ignored: false,
        effect: 'Needs clinician resolution before any update.',
    });
    expandedRows.add(id);
    renderReview();
}
function ignoreProposal(id) {
    const proposal = proposalById(id);
    if (!proposal)
        return;
    proposal.ignored = true;
    proposal.selected = false;
    proposal.resolved = true;
    expandedRows.delete(id);
    renderReview();
}
function restoreProposal(id) {
    const proposal = proposalById(id);
    if (!proposal)
        return;
    proposal.ignored = false;
    proposal.resolved = proposal.confidence === 'high';
    proposal.selected = proposal.resolved;
    if (!proposal.resolved)
        expandedRows.add(id);
    renderReview();
}
function useProposal(id) {
    const proposal = proposalById(id);
    if (!proposal || !changeList)
        return;
    const medicationInput = changeList.querySelector(`[data-edit-medication="${CSS.escape(id)}"]`);
    const kindInput = changeList.querySelector(`[data-edit-kind="${CSS.escape(id)}"]`);
    const actionInput = changeList.querySelector(`[data-edit-action="${CSS.escape(id)}"]`);
    const instructionInput = changeList.querySelector(`[data-edit-instruction="${CSS.escape(id)}"]`);
    const reasonInput = changeList.querySelector(`[data-edit-reason="${CSS.escape(id)}"]`);
    const errorTarget = changeList.querySelector(`[data-editor-error="${CSS.escape(id)}"]`);
    const medicationLabel = medicationInput?.value.trim() ?? '';
    const kind = (kindInput?.value ?? 'preventive');
    const action = (actionInput?.value ?? '');
    const instruction = instructionInput?.value.trim() ?? '';
    const reason = reasonInput?.value.trim() ?? '';
    if (!medicationLabel) {
        if (errorTarget)
            errorTarget.textContent = 'Choose or enter the medication.';
        medicationInput?.focus();
        return;
    }
    if (!action) {
        if (errorTarget)
            errorTarget.textContent = 'Choose what changed.';
        actionInput?.focus();
        return;
    }
    if (action === 'dose_change' && !instruction) {
        if (errorTarget)
            errorTarget.textContent = 'Enter the new dose or instructions.';
        instructionInput?.focus();
        return;
    }
    const details = extractInstructionDetails(`${ACTION_LABELS[action]} ${medicationLabel} ${instruction}`, action);
    proposal.medication = resolveMedicationForReview(medicationLabel, kind);
    proposal.medicationAlternatives = undefined;
    proposal.medicationText = proposal.medication.displayName;
    proposal.action = action;
    proposal.newDose = details.newDose;
    proposal.previousDose = details.previousDose ?? proposal.previousDose;
    proposal.frequency = details.frequency;
    proposal.prn = details.prn;
    proposal.route = details.route;
    proposal.instruction = instruction || details.instruction;
    proposal.reason = reason ? normalizeReason(reason) : undefined;
    proposal.issue = undefined;
    proposal.effect = effectForAction(action);
    proposal.resolved = true;
    proposal.selected = true;
    proposal.ignored = false;
    expandedRows.delete(id);
    renderReview();
}
function applyChanges() {
    if (!reconciliation || !encounterDate)
        return;
    try {
        updatedHandoff = buildProviderHandoffUpdate(reconciliation.proposals, encounterDate.value, temporaryTreatments.map(item => item.plan));
        if (updatedPreview)
            updatedPreview.textContent = JSON.stringify(updatedHandoff, null, 2);
        if (exportPanel)
            exportPanel.hidden = false;
        if (reviewPanel)
            reviewPanel.hidden = true;
        if (avsText)
            avsText.value = '';
        if (changeList)
            changeList.innerHTML = '';
        // Candidate source sentences and the full AVS are deliberately released
        // after approval. Only the structured updated handoff remains in memory.
        reconciliation = null;
        loadedHandoff = null;
        pendingFileText = '';
        temporaryTreatments.length = 0;
        renderTemporaryTreatments();
        expandedRows.clear();
        setStatus(applyStatus, '');
        setStatus(exportStatus, 'Patch-only Ember update created. The raw AVS was discarded from this workflow.', 'ok');
        exportPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    catch (error) {
        setStatus(applyStatus, error instanceof Error ? error.message : 'The changes could not be applied.', 'error');
    }
}
function downloadUpdatedHandoff() {
    if (!updatedHandoff || !encounterDate)
        return;
    const blob = new Blob([JSON.stringify(updatedHandoff, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ember-provider-update-${encounterDate.value || localDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
    setStatus(exportStatus, `Download requested: ${link.download}`, 'ok');
}
async function copyUpdatedHandoff() {
    if (!updatedHandoff)
        return;
    const text = JSON.stringify(updatedHandoff, null, 2);
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        }
        else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand('copy');
            textarea.remove();
            if (!copied)
                throw new Error('Clipboard unavailable');
        }
        setStatus(exportStatus, 'Ember update text copied.', 'ok');
    }
    catch {
        document.querySelector('#followup-export-panel .handoff-preview-details')?.setAttribute('open', '');
        setStatus(exportStatus, 'Clipboard unavailable. The complete updated handoff text is shown below.', 'warn');
    }
}
newTab?.addEventListener('click', () => switchWorkflow('new'));
followUpTab?.addEventListener('click', () => switchWorkflow('followup'));
fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file)
        return;
    readSelectedFile(file).catch(() => setStatus(loadStatus, 'This file could not be read.', 'error'));
});
loadButton?.addEventListener('click', openHandoff);
reviewButton?.addEventListener('click', reviewChanges);
clearHandoffButton?.addEventListener('click', clearLoadedHandoff);
applyButton?.addEventListener('click', applyChanges);
addManualButton?.addEventListener('click', addManualChange);
addTemporaryButton?.addEventListener('click', addTemporaryTreatment);
exportButton?.addEventListener('click', downloadUpdatedHandoff);
copyButton?.addEventListener('click', () => { copyUpdatedHandoff().catch(() => { }); });
changeList?.addEventListener('click', event => {
    const target = event.target;
    const edit = target.closest('[data-change-edit]');
    const ignore = target.closest('[data-change-ignore]');
    const restore = target.closest('[data-change-restore]');
    const use = target.closest('[data-change-use]');
    if (edit?.dataset.changeEdit) {
        const id = edit.dataset.changeEdit;
        if (expandedRows.has(id))
            expandedRows.delete(id);
        else
            expandedRows.add(id);
        renderReview();
    }
    else if (ignore?.dataset.changeIgnore) {
        ignoreProposal(ignore.dataset.changeIgnore);
    }
    else if (restore?.dataset.changeRestore) {
        restoreProposal(restore.dataset.changeRestore);
    }
    else if (use?.dataset.changeUse) {
        useProposal(use.dataset.changeUse);
    }
});
temporaryList?.addEventListener('input', event => {
    const target = event.target;
    const mappings = [
        ['followupTemporaryTitle', 'title'],
        ['followupTemporaryStart', 'start'],
        ['followupTemporaryEnd', 'end'],
        ['followupTemporarySchedule', 'schedule'],
    ];
    for (const [datasetKey, field] of mappings) {
        if (target.dataset[datasetKey] !== undefined) {
            updateTemporaryTreatment(Number(target.dataset[datasetKey]), field, target.value);
            return;
        }
    }
});
temporaryList?.addEventListener('change', event => {
    const target = event.target;
    if (target.dataset.followupTemporaryPreset !== undefined) {
        updateTemporaryTreatment(Number(target.dataset.followupTemporaryPreset), 'preset', target.value);
    }
});
temporaryList?.addEventListener('click', event => {
    const target = event.target;
    const remove = target.closest('[data-remove-followup-temporary]');
    if (!remove?.dataset.removeFollowupTemporary)
        return;
    temporaryTreatments.splice(Number(remove.dataset.removeFollowupTemporary), 1);
    renderTemporaryTreatments();
    updateReadiness();
});
if (encounterDate && !encounterDate.value)
    encounterDate.value = localDateString();
renderTemporaryTreatments();
