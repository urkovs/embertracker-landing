/* Ember provider handoff generator.
   Client-only: no network requests, no server persistence. */
import { TREATMENTS as SHARED_TREATMENTS } from './provider-handoff-taxonomy.js';
import {
  PROVIDER_HANDOFF_VERSION,
  TEMPORARY_TREATMENT_PRESETS,
  buildInitialMedicationHistory,
  temporaryTreatmentFromPreset,
  validateProviderTemporaryTreatment
} from './provider-handoff-core.js';

(function () {
  const STORAGE_KEY = 'ember.provider_handoff.defaults.v2';
  const LEGACY_STORAGE_KEYS = [
    'ember.provider_handoff.defaults.v1',
    'ember.provider_update.defaults.v1'
  ];
  const DEFAULT_LIMITS = {
    triptan_ergot: 9,
    nsaid: 14,
    acetaminophen: 14,
    combination: 9,
    opioid: 9,
    butalbital: 9
  };

  const TREATMENTS = SHARED_TREATMENTS;

  const BUCKETS = Object.keys(DEFAULT_LIMITS);
  const FIELD_IDS = [
    'providerName',
    'clinicName',
    'phone',
    'nextAppointment'
  ];
  const PICKER_KINDS = ['preventive', 'acute', 'nonPharma'];
  const selectedTreatments = {
    preventive: [],
    acute: [],
    nonPharma: []
  };
  const initialTemporaryTreatments = [];

  const $ = (id) => document.getElementById(id);
  const form = $('provider-update-form');
  const preview = $('json-preview');
  const statusBox = $('validation-status');
  const exportButton = $('export-json');
  const copyButton = $('copy-json');
  const lastAction = $('last-action');
  const defaultsPanel = $('provider-defaults-panel');
  const patientPlanPanel = $('patient-plan-panel');
  let showValidationMarkers = false;

  if (!form || !preview || !statusBox || !exportButton || !copyButton || !lastAction) {
    return;
  }

  function localDateString(date) {
    const d = date || new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function fieldValue(id) {
    const el = $(id);
    return el ? el.value.trim() : '';
  }

  function setFieldValue(id, value) {
    const el = $(id);
    if (el) el.value = value || '';
  }

  function isValidDateString(value) {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && localDateString(parsed) === value;
  }

  function readLines(id) {
    return fieldValue(id)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function selectedValues(kind) {
    return selectedTreatments[kind].map((entry) => entry.value);
  }

  function readLimitValue(bucket) {
    const el = $(`limit-${bucket}`);
    const raw = el ? el.value.trim() : '';
    if (raw === '') return NaN;
    return Number(raw);
  }

  function readLimitOverrides(updatedAt) {
    return BUCKETS.reduce((acc, bucket) => {
      acc[bucket] = {
        monthly: readLimitValue(bucket),
        source: 'provider',
        updatedAt
      };
      return acc;
    }, {});
  }

  function readProviderFields() {
    return {
      providerName: fieldValue('providerName'),
      clinicName: fieldValue('clinicName'),
      phone: fieldValue('phone')
    };
  }

  function buildPayload(createdAt) {
    const timestamp = createdAt || new Date().toISOString();
    const preventiveMedications = selectedValues('preventive');
    const acuteMedications = selectedValues('acute');
    return {
      schema: 'ember.provider_handoff',
      version: PROVIDER_HANDOFF_VERSION,
      createdAt: timestamp,
      createdBy: readProviderFields(),
      patientPlan: {
        nextAppointment: fieldValue('nextAppointment') || null,
        preventiveMedications,
        acuteMedications,
        nonPharmaTreatments: selectedValues('nonPharma'),
        acuteLimitOverrides: readLimitOverrides(timestamp),
        medicationHistory: buildInitialMedicationHistory(preventiveMedications, acuteMedications),
        followUpHistory: [],
        temporaryTreatments: initialTemporaryTreatments.map((entry) => JSON.parse(JSON.stringify(entry.plan)))
      }
    };
  }

  function validatePayload(payload) {
    const errors = [];
    const byId = {};

    if (!payload.createdBy.providerName) {
      errors.push('Provider name is required.');
      byId.providerName = true;
    }
    if (!payload.createdBy.clinicName) {
      errors.push('Clinic or practice is required.');
      byId.clinicName = true;
    }
    if (!payload.createdBy.phone) {
      errors.push('Phone is required.');
      byId.phone = true;
    }
    if (!isValidDateString(payload.patientPlan.nextAppointment)) {
      errors.push('Next appointment must use YYYY-MM-DD.');
      byId.nextAppointment = true;
    }

    BUCKETS.forEach((bucket) => {
      const value = payload.patientPlan.acuteLimitOverrides[bucket].monthly;
      if (!Number.isInteger(value) || value < 1 || value > 31) {
        errors.push('Each monthly limit must be a whole number from 1 to 31.');
        byId[`limit-${bucket}`] = true;
      }
    });

    const temporaryError = payload.patientPlan.temporaryTreatments
      .flatMap((treatment) => validateProviderTemporaryTreatment(treatment))[0];
    if (temporaryError) {
      errors.push(temporaryError);
      byId['initial-temporary-treatment-list'] = true;
    }

    return { ok: errors.length === 0, errors, byId };
  }

  function clearInvalidMarkers() {
    FIELD_IDS.forEach((id) => {
      const el = $(id);
      if (el) el.removeAttribute('aria-invalid');
    });
    BUCKETS.forEach((bucket) => {
      const el = $(`limit-${bucket}`);
      if (el) el.removeAttribute('aria-invalid');
    });
    $('initial-temporary-treatment-list')?.removeAttribute('aria-invalid');
  }

  function markInvalid(byId) {
    clearInvalidMarkers();
    Object.keys(byId).forEach((id) => {
      const el = $(id);
      if (el) el.setAttribute('aria-invalid', 'true');
    });
  }

  function setStatus(kind, text) {
    statusBox.classList.remove('is-ready', 'is-error');
    if (kind) statusBox.classList.add(`is-${kind}`);
    const message = statusBox.querySelector('span:last-child');
    if (message) message.textContent = text;
  }

  function setLastAction(text, kind) {
    lastAction.textContent = text;
    lastAction.classList.remove('is-ok', 'is-warn', 'is-error');
    if (kind) lastAction.classList.add(`is-${kind}`);
  }

  function collapseDefaultsPanel(options) {
    if (!defaultsPanel) return;
    defaultsPanel.classList.add('is-collapsed');
    if (options && options.scroll && patientPlanPanel) {
      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      patientPlanPanel.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  function expandDefaultsPanel() {
    if (!defaultsPanel) return;
    defaultsPanel.classList.remove('is-collapsed');
    const first = $('providerName');
    if (first && typeof first.focus === 'function') first.focus();
  }

  function updateSummary(payload) {
    const preventives = $('summary-preventives');
    const acutes = $('summary-acutes');
    const nonPharma = $('summary-nonpharma');
    const limits = $('summary-limits');
    const temporary = $('summary-temporary');
    if (preventives) preventives.textContent = String(payload.patientPlan.preventiveMedications.length);
    if (acutes) acutes.textContent = String(payload.patientPlan.acuteMedications.length);
    if (nonPharma) nonPharma.textContent = String(payload.patientPlan.nonPharmaTreatments.length);
    if (limits) limits.textContent = String(BUCKETS.length);
    if (temporary) temporary.textContent = String(payload.patientPlan.temporaryTreatments.length);
  }

  function render() {
    PICKER_KINDS.forEach(renderSelectedTreatments);
    const payload = buildPayload();
    const validation = validatePayload(payload);
    preview.textContent = JSON.stringify(payload, null, 2);
    updateSummary(payload);
    if (showValidationMarkers) {
      markInvalid(validation.byId);
    } else {
      clearInvalidMarkers();
    }

    exportButton.disabled = !validation.ok;
    copyButton.disabled = !validation.ok;

    if (validation.ok) {
      setStatus('ready', 'Ready to export. Review the handoff, then send the file or text to your patient.');
    } else if (!showValidationMarkers) {
      setStatus(null, 'Fill the required provider fields to export.');
    } else {
      const shown = validation.errors.slice(0, 2).join(' ');
      setStatus('error', shown || 'Fix the highlighted fields to export.');
    }

    return { payload, validation };
  }

  function downloadHandoffFile(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function exportProviderHandoff() {
    showValidationMarkers = true;
    flushPendingTreatmentInputs();
    const { payload, validation } = render();
    if (!validation.ok) {
      focusFirstInvalid(validation.byId);
      setLastAction('Fix the highlighted fields before exporting.', 'error');
      return;
    }

    const filename = `ember-provider-handoff-${localDateString()}.json`;
    downloadHandoffFile(filename, payload);
    setLastAction(`Download requested: ${filename}. If this preview browser does not show a file, use Copy Handoff Text.`, 'ok');
  }

  async function copyHandoffText() {
    showValidationMarkers = true;
    flushPendingTreatmentInputs();
    const { payload, validation } = render();
    if (!validation.ok) {
      focusFirstInvalid(validation.byId);
      setLastAction('Fix the highlighted fields before copying.', 'error');
      return;
    }

    const text = JSON.stringify(payload, null, 2);
    try {
      await copyText(text);
      setLastAction('Handoff text copied to clipboard.', 'ok');
    } catch (err) {
      openAndSelectPreview();
      setLastAction('Clipboard unavailable here. The full handoff text is selected below.', 'warn');
    }
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (err) {
        // Fall through to the legacy copy path. Some preview browsers expose
        // navigator.clipboard but block the actual write.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Clipboard fallback unavailable');
  }

  function openAndSelectPreview() {
    const details = document.querySelector('.handoff-preview-details');
    if (details) details.open = true;
    if (!window.getSelection || !document.createRange) {
      preview.focus();
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(preview);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    preview.focus();
  }

  function focusFirstInvalid(byId) {
    const firstId = Object.keys(byId)[0];
    const el = firstId ? $(firstId) : null;
    if (el && typeof el.focus === 'function') el.focus();
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function searchableTerms(entry) {
    return [entry.display, entry.value, entry.key].concat(entry.aliases || []).map(normalizeText).filter(Boolean);
  }

  function scoreEntry(entry, query) {
    const q = normalizeText(query);
    if (!q) return 0;
    let best = 0;
    searchableTerms(entry).forEach((term) => {
      if (term === q) best = Math.max(best, 120);
      else if (term.startsWith(q)) best = Math.max(best, 95 - Math.max(0, term.length - q.length) * 0.4);
      else if (term.includes(q)) best = Math.max(best, 72 - term.indexOf(q));
      else if (q.length >= 4) {
        const distance = levenshtein(q, term);
        const allowed = Math.max(1, Math.min(3, Math.floor(Math.max(q.length, term.length) * 0.22)));
        if (distance <= allowed) best = Math.max(best, 58 - distance * 6);
      }
    });
    return best;
  }

  function treatmentMatches(kind, query) {
    return TREATMENTS[kind]
      .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.display.localeCompare(b.entry.display))
      .slice(0, 7);
  }

  function renderSuggestions(kind) {
    const input = $(`${kind}Input`);
    const menu = $(`${kind}Suggestions`);
    if (!input || !menu) return;
    const query = input.value.trim();
    const matches = treatmentMatches(kind, query);
    menu.innerHTML = '';
    if (!query || matches.length === 0) {
      menu.hidden = true;
      return;
    }
    matches.forEach(({ entry, score }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'suggestion-option';
      button.setAttribute('role', 'option');
      button.dataset.kind = kind;
      button.dataset.key = entry.key;
      const hint = score < 70 ? 'Possible match' : entry.meta;
      button.innerHTML = `<span>${escapeHtml(entry.display)}</span><em>${escapeHtml(hint)}</em>`;
      menu.appendChild(button);
    });
    menu.hidden = false;
  }

  function addTreatment(kind, entry, customLabel, options) {
    const source = entry || {
      key: `custom-${normalizeText(customLabel).replace(/\s+/g, '-') || Date.now()}`,
      display: customLabel,
      value: customLabel,
      meta: kind === 'acute' ? 'Custom acute' : kind === 'preventive' ? 'Custom preventive' : 'Custom non-pharma',
      custom: true
    };
    const identity = normalizeText(source.value);
    if (!identity) return;
    if (!selectedTreatments[kind].some((item) => normalizeText(item.value) === identity)) {
      selectedTreatments[kind].push(source);
    }
    const input = $(`${kind}Input`);
    const menu = $(`${kind}Suggestions`);
    if (input) input.value = '';
    if (menu) menu.hidden = true;
    if (!options || !options.skipRender) render();
    if (input && (!options || !options.skipFocus)) input.focus();
  }

  function addTopMatchOrCustom(kind, options) {
    const input = $(`${kind}Input`);
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;
    const top = treatmentMatches(kind, query)[0];
    if (top && top.score >= 52) addTreatment(kind, top.entry, null, options);
    else addTreatment(kind, null, query, options);
  }

  function flushPendingTreatmentInputs() {
    PICKER_KINDS.forEach((kind) => {
      addTopMatchOrCustom(kind, { skipRender: true, skipFocus: true });
      const menu = $(`${kind}Suggestions`);
      if (menu) menu.hidden = true;
    });
  }

  function removeTreatment(kind, index) {
    selectedTreatments[kind].splice(index, 1);
    render();
  }

  function renderSelectedTreatments(kind) {
    const target = $(`${kind}Selected`);
    if (!target) return;
    target.innerHTML = '';
    selectedTreatments[kind].forEach((entry, index) => {
      const chip = document.createElement('span');
      chip.className = `selected-chip${entry.custom ? ' is-custom' : ''}`;
      chip.innerHTML = `
        <span>${escapeHtml(entry.display)}</span>
        <em>${escapeHtml(entry.meta || 'Selected')}</em>
        <button type="button" aria-label="Remove ${escapeHtml(entry.display)}" data-remove-kind="${kind}" data-remove-index="${index}">×</button>
      `;
      target.appendChild(chip);
    });
  }

  function initTreatmentPickers() {
    PICKER_KINDS.forEach((kind) => {
      const input = $(`${kind}Input`);
      const addButton = document.querySelector(`[data-add-custom="${kind}"]`);
      const menu = $(`${kind}Suggestions`);
      if (!input || !addButton || !menu) return;

      input.addEventListener('input', () => renderSuggestions(kind));
      input.addEventListener('focus', () => renderSuggestions(kind));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addTopMatchOrCustom(kind);
        } else if (event.key === 'Escape') {
          menu.hidden = true;
        }
      });
      addButton.addEventListener('click', () => addTopMatchOrCustom(kind));
      menu.addEventListener('click', (event) => {
        const button = event.target.closest('.suggestion-option');
        if (!button) return;
        const selected = TREATMENTS[kind].find((entry) => entry.key === button.dataset.key);
        if (selected) addTreatment(kind, selected);
      });
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('.treatment-picker')) return;
      PICKER_KINDS.forEach((kind) => {
        const menu = $(`${kind}Suggestions`);
        if (menu) menu.hidden = true;
      });
    });

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-kind]');
      if (!button) return;
      removeTreatment(button.dataset.removeKind, Number(button.dataset.removeIndex));
    });
  }

  function temporaryPresetOptions(selectedId) {
    return TEMPORARY_TREATMENT_PRESETS.map((preset) => (
      `<option value="${escapeHtml(preset.id)}"${preset.id === selectedId ? ' selected' : ''}>${escapeHtml(preset.label)}</option>`
    )).join('') + `<option value="custom"${selectedId === 'custom' ? ' selected' : ''}>Something else</option>`;
  }

  function temporaryScheduleOptions(selected) {
    const options = [
      ['as_directed', 'As directed'],
      ['one_time', 'One time'],
      ['once_daily', 'Once daily'],
      ['twice_daily', 'Twice daily'],
      ['three_times_daily', 'Three times daily'],
      ['taper', 'Taper']
    ];
    return options.map(([value, label]) => (
      `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`
    )).join('');
  }

  function renderInitialTemporaryTreatments() {
    const target = $('initial-temporary-treatment-list');
    if (!target) return;
    target.innerHTML = initialTemporaryTreatments.map((entry, index) => {
      const plan = entry.plan;
      return `
        <article class="temporary-treatment-row" data-initial-temporary-index="${index}">
          <div class="temporary-treatment-row-head">
            <strong>Temporary treatment ${index + 1}</strong>
            <button class="btn-ghost btn-compact" type="button" data-remove-initial-temporary="${index}">Remove</button>
          </div>
          <div class="temporary-treatment-grid">
            <label class="field">
              <span class="field-label">Treatment</span>
              <select class="input" data-initial-temporary-preset="${index}">${temporaryPresetOptions(entry.presetId)}</select>
            </label>
            <label class="field">
              <span class="field-label">Name</span>
              <input class="input" data-initial-temporary-title="${index}" value="${escapeHtml(plan.title)}" />
            </label>
            <label class="field">
              <span class="field-label">Start</span>
              <input class="input input-date" data-initial-temporary-start="${index}" type="date" value="${escapeHtml(plan.plannedStartDate)}" />
            </label>
            <label class="field">
              <span class="field-label">End</span>
              <input class="input input-date" data-initial-temporary-end="${index}" type="date" value="${escapeHtml(plan.plannedEndDate)}" />
            </label>
            <label class="field">
              <span class="field-label">Schedule</span>
              <select class="input" data-initial-temporary-schedule="${index}">${temporaryScheduleOptions(plan.schedule)}</select>
            </label>
          </div>
        </article>`;
    }).join('');
    target.hidden = initialTemporaryTreatments.length === 0;
  }

  function addInitialTemporaryTreatment() {
    const plan = temporaryTreatmentFromPreset('steroid_pack', localDateString());
    if (!plan) return;
    initialTemporaryTreatments.push({ presetId: 'steroid_pack', plan });
    renderInitialTemporaryTreatments();
    render();
  }

  function updateInitialTemporaryTreatment(index, field, value) {
    const entry = initialTemporaryTreatments[index];
    if (!entry) return;
    if (field === 'preset') {
      entry.presetId = value;
      if (value === 'custom') {
        entry.plan = {
          title: '',
          kind: 'other',
          components: [{ kind: 'other', labelSnapshot: '' }],
          plannedStartDate: entry.plan.plannedStartDate || localDateString(),
          plannedEndDate: entry.plan.plannedStartDate || localDateString(),
          schedule: 'as_directed'
        };
      } else {
        const plan = temporaryTreatmentFromPreset(value, entry.plan.plannedStartDate || localDateString());
        if (plan) entry.plan = plan;
      }
      renderInitialTemporaryTreatments();
      render();
      return;
    }
    if (field === 'title') {
      entry.plan.title = value;
      entry.plan.components = [{ kind: entry.plan.kind === 'procedure' ? 'procedure' : 'other', labelSnapshot: value }];
    } else if (field === 'start') {
      const preset = TEMPORARY_TREATMENT_PRESETS.find((item) => item.id === entry.presetId);
      const replacement = preset ? temporaryTreatmentFromPreset(preset.id, value) : null;
      if (replacement) entry.plan = replacement;
      else entry.plan.plannedStartDate = value;
      renderInitialTemporaryTreatments();
    } else if (field === 'end') entry.plan.plannedEndDate = value;
    else if (field === 'schedule') entry.plan.schedule = value;
    render();
  }

  function initInitialTemporaryTreatments() {
    $('add-initial-temporary-treatment')?.addEventListener('click', addInitialTemporaryTreatment);
    $('initial-temporary-treatment-list')?.addEventListener('input', (event) => {
      const target = event.target;
      const mappings = [
        ['initialTemporaryTitle', 'title'],
        ['initialTemporaryStart', 'start'],
        ['initialTemporaryEnd', 'end'],
        ['initialTemporarySchedule', 'schedule']
      ];
      for (const [datasetKey, field] of mappings) {
        if (target.dataset?.[datasetKey] !== undefined) {
          updateInitialTemporaryTreatment(Number(target.dataset[datasetKey]), field, target.value);
          return;
        }
      }
    });
    $('initial-temporary-treatment-list')?.addEventListener('change', (event) => {
      const target = event.target;
      if (target.dataset?.initialTemporaryPreset !== undefined) {
        updateInitialTemporaryTreatment(Number(target.dataset.initialTemporaryPreset), 'preset', target.value);
      }
    });
    $('initial-temporary-treatment-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-initial-temporary]');
      if (!button) return;
      initialTemporaryTreatments.splice(Number(button.dataset.removeInitialTemporary), 1);
      renderInitialTemporaryTreatments();
      render();
    });
    renderInitialTemporaryTreatments();
  }

  function levenshtein(a, b) {
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    const curr = Array.from({ length: b.length + 1 }, () => 0);
    for (let i = 1; i <= a.length; i += 1) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
    }
    return prev[b.length];
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function currentDefaultsPayload() {
    const savedAt = new Date().toISOString();
    return {
      schema: 'ember.provider_handoff_defaults',
      version: 1,
      savedAt,
      createdBy: readProviderFields(),
      acuteLimitDefaults: BUCKETS.reduce((acc, bucket) => {
        acc[bucket] = readLimitValue(bucket);
        return acc;
      }, {})
    };
  }

  function saveDefaults() {
    showValidationMarkers = true;
    const defaults = currentDefaultsPayload();
    const validation = validateDefaults(defaults);
    if (!validation.ok) {
      markInvalid(validation.byId);
      focusFirstInvalid(validation.byId);
      setLastAction(validation.errors[0], 'error');
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    setLastAction('Provider defaults saved in this browser. They will load automatically next time.', 'ok');
    collapseDefaultsPanel({ scroll: true });
    render();
  }

  function validateDefaults(defaults) {
    const errors = [];
    const byId = {};
    if (!defaults.createdBy.providerName) {
      errors.push('Provider name is required before saving defaults.');
      byId.providerName = true;
    }
    if (!defaults.createdBy.clinicName) {
      errors.push('Clinic or practice is required before saving defaults.');
      byId.clinicName = true;
    }
    if (!defaults.createdBy.phone) {
      errors.push('Phone is required before saving defaults.');
      byId.phone = true;
    }
    BUCKETS.forEach((bucket) => {
      const value = defaults.acuteLimitDefaults[bucket];
      if (!Number.isInteger(value) || value < 1 || value > 31) {
        errors.push('Each monthly limit must be a whole number from 1 to 31.');
        byId[`limit-${bucket}`] = true;
      }
    });
    return { ok: errors.length === 0, errors, byId };
  }

  function parseDefaults(raw) {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Saved defaults are empty.');
    }
    if (
      parsed.schema &&
      parsed.schema !== 'ember.provider_handoff_defaults' &&
      parsed.schema !== 'ember.provider_defaults'
    ) {
      throw new Error('This is not an Ember provider defaults file.');
    }
    if (!parsed.createdBy || typeof parsed.createdBy !== 'object') {
      throw new Error('Saved defaults are missing provider details.');
    }
    return parsed;
  }

  function applyDefaults(defaults) {
    const createdBy = defaults.createdBy || {};
    setFieldValue('providerName', createdBy.providerName);
    setFieldValue('clinicName', createdBy.clinicName);
    setFieldValue('phone', createdBy.phone);

    const savedLimits = defaults.acuteLimitDefaults || defaults.acuteLimitOverrides || {};
    BUCKETS.forEach((bucket) => {
      const raw = savedLimits[bucket];
      const value = raw && typeof raw === 'object' ? raw.monthly : raw;
      const el = $(`limit-${bucket}`);
      if (el && Number.isFinite(Number(value))) el.value = String(Number(value));
    });

    render();
  }

  function loadSavedDefaults() {
    const raw = localStorage.getItem(STORAGE_KEY)
      || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!raw) return false;

    try {
      applyDefaults(parseDefaults(raw));
      setLastAction('Saved provider defaults loaded automatically for this browser.', 'ok');
      collapseDefaultsPanel();
      return true;
    } catch (err) {
      setLastAction('Saved defaults could not be read. Clear and save again.', 'error');
      return false;
    }
  }

  function clearDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    setLastAction('Saved provider defaults cleared from this browser.', 'ok');
    expandDefaultsPanel();
  }

  function resetLimits() {
    BUCKETS.forEach((bucket) => {
      const el = $(`limit-${bucket}`);
      if (el) el.value = String(DEFAULT_LIMITS[bucket]);
    });
    setLastAction('Acute medication limits reset to Ember standards.', 'ok');
    render();
  }

  function initReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    targets.forEach((el) => io.observe(el));
  }

  function initNav() {
    const nav = $('nav');
    const header = document.getElementById('nav');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 12) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    void nav;
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', () => render());
  form.addEventListener('change', () => render());

  $('save-defaults').addEventListener('click', saveDefaults);
  $('clear-defaults').addEventListener('click', clearDefaults);
  $('edit-defaults').addEventListener('click', expandDefaultsPanel);
  $('reset-limits').addEventListener('click', resetLimits);
  exportButton.addEventListener('click', exportProviderHandoff);
  copyButton.addEventListener('click', copyHandoffText);

  initTreatmentPickers();
  initInitialTemporaryTreatments();
  initNav();
  initReveal();
  loadSavedDefaults();
  render();

  window.EmberProviderHandoff = {
    DEFAULT_LIMITS,
    buildPayload,
    validatePayload,
    readLines,
    selectedValues,
    localDateString
  };
})();
