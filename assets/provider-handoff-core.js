import { MEDICATION_TREATMENTS, TREATMENTS, } from '../assets/provider-handoff-taxonomy.js';
export { TREATMENTS };
export const PROVIDER_HANDOFF_SCHEMA = 'ember.provider_handoff';
export const PROVIDER_HANDOFF_VERSION = 2;
export const SUPPORTED_PROVIDER_HANDOFF_VERSIONS = [1, 2];
export const PROVIDER_HANDOFF_UPDATE_SCHEMA = 'ember.provider_handoff_update';
export const PROVIDER_HANDOFF_UPDATE_VERSION = 1;
export const DEFAULT_BOUNDARY_ALIASES = ['BEGIN EMBER UPDATE'];
/** Provider-facing shortcuts mirror Ember's patient-side Temporary treatment
 * identities. They carry names and calendar plans only, never doses or a
 * clinical recommendation. */
export const TEMPORARY_TREATMENT_PRESETS = [
    {
        id: 'steroid_pack',
        label: 'Steroid pack',
        title: 'Medrol Dosepak',
        kind: 'medication_course',
        schedule: 'as_directed',
        inclusiveDayCount: 6,
        components: [{ kind: 'medication', labelSnapshot: 'Medrol Dosepak' }],
    },
    {
        id: 'nerve_block',
        label: 'Nerve block',
        title: 'Nerve block',
        kind: 'procedure',
        schedule: 'one_time',
        components: [{ kind: 'procedure', labelSnapshot: 'Nerve block', linkedNonPharmaName: 'Nerve blocks' }],
    },
    {
        id: 'trigger_point_injections',
        label: 'Trigger point injections',
        title: 'Trigger point injections',
        kind: 'procedure',
        schedule: 'one_time',
        components: [{ kind: 'procedure', labelSnapshot: 'Trigger point injections', linkedNonPharmaName: 'Trigger point injections' }],
    },
    {
        id: 'prochlorperazine',
        label: 'Prochlorperazine',
        title: 'Prochlorperazine',
        kind: 'medication_course',
        schedule: 'as_directed',
        components: [{ kind: 'medication', labelSnapshot: 'Prochlorperazine', linkedAcuteMedicationKey: 'compazine' }],
    },
    {
        id: 'depakote',
        label: 'Depakote',
        title: 'Depakote',
        kind: 'medication_course',
        schedule: 'as_directed',
        components: [{ kind: 'medication', labelSnapshot: 'Depakote' }],
    },
    {
        id: 'olanzapine',
        label: 'Olanzapine',
        title: 'Olanzapine',
        kind: 'medication_course',
        schedule: 'as_directed',
        components: [{ kind: 'medication', labelSnapshot: 'Olanzapine' }],
    },
    {
        id: 'seroquel',
        label: 'Seroquel (quetiapine)',
        title: 'Seroquel (quetiapine)',
        kind: 'medication_course',
        schedule: 'as_directed',
        components: [{ kind: 'medication', labelSnapshot: 'Seroquel (quetiapine)' }],
    },
];
const ACTION_PATTERNS = [
    { action: 'never_started', pattern: /\b(?:never\s+(?:started|took)|did\s+not\s+start|didn't\s+start|decided\s+not\s+to\s+start)\b/i },
    { action: 'restart', pattern: /\b(?:restart(?:ed|ing)?|resume(?:d|s|ing)?)\b/i },
    { action: 'hold', pattern: /\b(?:hold|pause(?:d|s|ing)?|temporarily\s+(?:stop|discontinue))\b/i },
    { action: 'dose_change', direction: 'increase', pattern: /\b(?:increase(?:d|s|ing)?|raise(?:d|s|ing)?)\b/i },
    { action: 'dose_change', direction: 'decrease', pattern: /\b(?:decrease(?:d|s|ing)?|reduce(?:d|s|ing)?|lower(?:ed|s|ing)?)\b/i },
    { action: 'dose_change', direction: 'change', pattern: /\b(?:change(?:d|s|ing)?(?:\s+(?:the\s+)?dose|\b[^.;\n]{0,60}\bto\b)|take\b.+\binstead\s+of)\b/i },
    { action: 'continue', pattern: /\b(?:continue(?:d|s|ing)?|remain\s+on|maintain|keep\s+taking)\b/i },
    { action: 'stop', pattern: /\b(?:stop(?:ped|ping)?|discontinue(?:d|s|ing)?|d\s*[\/.]\s*c|dc)\b/i },
    { action: 'start', pattern: /\b(?:start(?:ed|s|ing)?|begin|began|initiate(?:d|s|ing)?|add(?:ed|s|ing)?)\b/i },
];
const ANY_ACTION_SOURCE = '(?:never\\s+(?:started|took)|did\\s+not\\s+start|didn\'t\\s+start|decided\\s+not\\s+to\\s+start|restart(?:ed|ing)?|resume(?:d|s|ing)?|hold|pause(?:d|s|ing)?|temporarily\\s+(?:stop|discontinue)|increase(?:d|s|ing)?|raise(?:d|s|ing)?|decrease(?:d|s|ing)?|reduce(?:d|s|ing)?|lower(?:ed|s|ing)?|change(?:d|s|ing)?|continue(?:d|s|ing)?|remain\\s+on|maintain|keep\\s+taking|stop(?:ped|ping)?|discontinue(?:d|s|ing)?|d\\s*[\\/.]\\s*c|dc|start(?:ed|s|ing)?|begin|began|initiate(?:d|s|ing)?|add(?:ed|s|ing)?)';
const NEGATED_ACTION = /\b(?:do|does|did)\s+not\s+(?:stop|discontinue|hold|pause|start|begin|increase|decrease|reduce)|\b(?:don't|doesn't|didn't)\s+(?:stop|discontinue|hold|pause|increase|decrease|reduce)\b/i;
const CONDITIONAL_OR_FUTURE = /\b(?:if|unless|may|might|could|consider|considering|plan\s+to|planning\s+to|will\s+consider|after\s+\d+\s+(?:days?|weeks?|months?))\b/i;
const HISTORICAL_LANGUAGE = /\b(?:previously|in\s+the\s+past|historically|last\s+(?:year|month)|had\s+(?:stopped|discontinued)|was\s+(?:previously\s+)?(?:stopped|discontinued))\b/i;
const NO_CHANGE_LANGUAGE = /\b(?:no\s+changes?\s+to\s+(?:current\s+)?medications?|continue\s+all\s+current\s+medications?|medications?\s+unchanged)\b/i;
const DOSE_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|mL|units?|sprays?|tablets?|tabs?|capsules?|caps?)\b/gi;
function normalized(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[’]/g, "'")
        .replace(/\([^)]*\)/g, ' ')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function slug(value) {
    return normalized(value).replace(/\s+/g, '-') || 'item';
}
function unique(values) {
    return Array.from(new Set(values));
}
function identityFromTaxonomy(entry, kind) {
    return {
        key: entry.key,
        kind,
        displayName: entry.display,
        handoffValue: entry.value,
        category: entry.meta,
    };
}
function medicationTerms(entry) {
    return unique([
        entry.key,
        entry.display,
        entry.value,
        ...entry.aliases,
    ].map(normalized).filter(Boolean));
}
function textContainsTerm(text, term) {
    const haystack = ` ${normalized(text)} `;
    return haystack.includes(` ${term} `);
}
export function medicationMatches(text, kindHint) {
    const kinds = kindHint ? [kindHint] : ['preventive', 'acute'];
    const matches = [];
    for (const kind of kinds) {
        for (const entry of TREATMENTS[kind]) {
            const terms = medicationTerms(entry).filter(term => textContainsTerm(text, term));
            if (terms.length === 0)
                continue;
            matches.push({
                identity: identityFromTaxonomy(entry, kind),
                termLength: Math.max(...terms.map(term => term.length)),
            });
        }
    }
    if (matches.length === 0)
        return [];
    const longest = Math.max(...matches.map(match => match.termLength));
    const material = matches.filter(match => match.termLength === longest).map(match => match.identity);
    return material.filter((identity, index) => material.findIndex(other => (other.key === identity.key && other.kind === identity.kind)) === index);
}
export function normalizeMedication(text, kindHint, context = text) {
    let alternatives = medicationMatches(text, kindHint);
    if (alternatives.length <= 1)
        return { medication: alternatives[0], alternatives };
    const contextual = normalized(context);
    if (/\b(?:prn|as needed|at onset|rescue)\b/.test(contextual)) {
        const acute = alternatives.filter(item => item.kind === 'acute');
        if (acute.length === 1)
            return { medication: acute[0], alternatives };
    }
    if (/\b(?:preventive|prevention|every other day|every 48 hours)\b/.test(contextual)) {
        const preventive = alternatives.filter(item => item.kind === 'preventive');
        if (preventive.length === 1)
            return { medication: preventive[0], alternatives };
    }
    // If two matches share a generic term but one line includes a specific brand,
    // prefer the exact brand/key match. This is deterministic, never fuzzy.
    const exact = alternatives.filter(item => {
        const candidateTerms = [item.key, item.displayName, item.handoffValue]
            .map(normalized)
            .filter(Boolean);
        return candidateTerms.includes(normalized(text));
    });
    if (exact.length === 1)
        return { medication: exact[0], alternatives };
    alternatives = alternatives.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { alternatives };
}
function boundaryRegex(alias) {
    const words = alias.trim().split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(words.join('\\s+'), 'i');
}
export function extractUpdateBoundary(raw, aliases = DEFAULT_BOUNDARY_ALIASES) {
    let best = null;
    aliases.forEach(alias => {
        const match = boundaryRegex(alias).exec(raw);
        if (!match)
            return;
        if (!best || match.index < best.index) {
            best = { index: match.index, length: match[0].length, marker: match[0] };
        }
    });
    if (!best)
        return { content: raw, markerFound: false, sourceOffset: 0 };
    const found = best;
    const sourceOffset = found.index + found.length;
    return {
        content: raw.slice(sourceOffset).replace(/^\s*[:\-–—]?\s*/, ''),
        markerFound: true,
        marker: found.marker,
        sourceOffset,
    };
}
function splitStatements(text) {
    const spans = [];
    const coarse = /[^\n;]+(?:[;\n]|$)/g;
    for (const match of text.matchAll(coarse)) {
        const raw = match[0].replace(/[;\n]+$/, '');
        const leading = raw.match(/^\s*(?:[-*•]\s*)?/)?.[0].length ?? 0;
        const trimmed = raw.slice(leading).trim();
        if (!trimmed)
            continue;
        const baseStart = (match.index ?? 0) + leading + raw.slice(leading).indexOf(trimmed);
        const actionSplit = new RegExp(`(?:\\s+(?:and|then)\\s+|[.!?]\\s+|,\\s+)(?=${ANY_ACTION_SOURCE}\\b)`, 'ig');
        let cursor = 0;
        for (const split of trimmed.matchAll(actionSplit)) {
            const part = trimmed.slice(cursor, split.index).trim();
            if (part) {
                const local = trimmed.indexOf(part, cursor);
                spans.push({ text: part, start: baseStart + local, end: baseStart + local + part.length });
            }
            cursor = (split.index ?? 0) + split[0].length;
        }
        const tail = trimmed.slice(cursor).trim();
        if (tail) {
            const local = trimmed.indexOf(tail, cursor);
            spans.push({ text: tail, start: baseStart + local, end: baseStart + local + tail.length });
        }
    }
    return spans;
}
function detectAction(text) {
    for (const candidate of ACTION_PATTERNS) {
        const match = candidate.pattern.exec(text);
        if (match)
            return { action: candidate.action, direction: candidate.direction, matchedText: match[0] };
    }
    return {};
}
function parseDose(raw) {
    const match = new RegExp(DOSE_PATTERN.source, 'i').exec(raw);
    return {
        raw: raw.trim(),
        value: match ? Number(match[1]) : undefined,
        unit: match?.[2]?.toLowerCase(),
    };
}
export function extractInstructionDetails(text, action) {
    const details = {};
    const doseMatches = Array.from(text.matchAll(new RegExp(DOSE_PATTERN.source, 'gi')));
    const fromTo = new RegExp(`\\bfrom\\s+(${DOSE_PATTERN.source})\\s+to\\s+(${DOSE_PATTERN.source})`, 'i').exec(text);
    const insteadOf = new RegExp(`(${DOSE_PATTERN.source})\\s+instead\\s+of\\s+(${DOSE_PATTERN.source})`, 'i').exec(text);
    if (action === 'dose_change' && fromTo) {
        details.previousDose = parseDose(fromTo[1]);
        details.newDose = parseDose(fromTo[4]);
    }
    else if (action === 'dose_change' && insteadOf) {
        details.newDose = parseDose(insteadOf[1]);
        details.previousDose = parseDose(insteadOf[4]);
    }
    else if (doseMatches.length > 0) {
        const doses = doseMatches.map(match => parseDose(match[0]));
        if (action === 'dose_change' && doses.length >= 2) {
            details.previousDose = doses[0];
            details.newDose = doses[1];
        }
        else {
            details.newDose = doses[doses.length - 1];
        }
    }
    const frequencyMatch = text.match(/\b(?:once\s+daily|twice\s+daily|three\s+times\s+daily|daily|nightly|every\s+other\s+day|every\s+\d+\s+(?:hours?|days?|weeks?|months?)|every\s+\d+\s+to\s+\d+\s+weeks?|once\s+weekly|monthly|as\s+needed|prn|at\s+onset)\b/i);
    if (frequencyMatch)
        details.frequency = frequencyMatch[0].replace(/\s+/g, ' ').trim();
    details.prn = Boolean(text.match(/\b(?:as\s+needed|prn|at\s+onset|rescue)\b/i));
    const routeMatch = text.match(/\b(?:by\s+mouth|orally|oral|nasal\s+(?:spray|powder)|subcutaneous(?:ly)?|injection|intravenous(?:ly)?|iv|eye\s+drops?|intranasal(?:ly)?)\b/i);
    if (routeMatch)
        details.route = routeMatch[0].replace(/\s+/g, ' ').trim();
    const reasonMatch = text.match(/\b(?:due\s+to|because\s+of|because|secondary\s+to)\s+(.+?)(?:[.;]|$)/i);
    if (reasonMatch)
        details.reason = normalizeReason(reasonMatch[1]);
    if (action === 'never_started')
        details.reason = { code: 'never_started', text: 'Never started' };
    const instructionParts = [details.newDose?.raw, details.frequency, details.route]
        .filter((value) => Boolean(value));
    if (instructionParts.length > 0)
        details.instruction = unique(instructionParts).join(' · ');
    return details;
}
export function normalizeReason(raw) {
    const text = raw.trim().replace(/[.;]+$/, '').trim();
    const key = normalized(text);
    let code = 'other';
    if (/\b(?:ineffective|lack of efficacy|inadequate efficacy|not effective|did not help|didn t help|no benefit)\b/.test(key)) {
        code = 'ineffective';
    }
    else if (/\b(?:side effects?|adverse effects?|intolerable|not tolerated|cognitive effects?|allergic)\b/.test(key)) {
        code = 'adverse_effects';
    }
    else if (/\b(?:insurance|not covered|denied|cost|afford|access)\b/.test(key)) {
        code = 'access';
    }
    else if (/\b(?:never started|did not start|never took)\b/.test(key)) {
        code = 'never_started';
    }
    return { code, text };
}
function extractUnknownMedicationText(text, matchedAction) {
    let value = text;
    if (matchedAction)
        value = value.replace(new RegExp(matchedAction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
    value = value
        .replace(/\b(?:the|patient|she|he|they|we|please)\b/gi, ' ')
        .replace(new RegExp(DOSE_PATTERN.source, 'gi'), ' ')
        .replace(/\b(?:once\s+daily|twice\s+daily|three\s+times\s+daily|daily|nightly|every\s+other\s+day|every\s+\d+\s+(?:hours?|days?|weeks?|months?)|as\s+needed|prn|at\s+onset|by\s+mouth|orally|oral|nasal\s+(?:spray|powder)|subcutaneous(?:ly)?|injection|eye\s+drops?)\b/gi, ' ')
        .replace(/\b(?:due\s+to|because\s+of|because|secondary\s+to)\b.*$/i, ' ')
        .replace(/[^a-zA-Z0-9+\- ]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    return value.split(/\s+/).slice(0, 5).join(' ');
}
function makeCandidateId(index, sourceStart) {
    return `candidate-${sourceStart}-${index}`;
}
function candidateForStatement(statement, index) {
    const text = statement.text.trim();
    if (!text)
        return null;
    if (NO_CHANGE_LANGUAGE.test(text))
        return null;
    const actionResult = detectAction(text);
    const details = extractInstructionDetails(text, actionResult.action);
    const matchResult = normalizeMedication(text, undefined, text);
    const matches = matchResult.alternatives;
    const negated = NEGATED_ACTION.test(text) && actionResult.action !== 'never_started';
    const conditional = CONDITIONAL_OR_FUTURE.test(text);
    const historical = HISTORICAL_LANGUAGE.test(text);
    if (!actionResult.action && matches.length === 0)
        return null;
    let confidence = 'high';
    let issue;
    let medication = matchResult.medication;
    if (matches.length > 1 && !medication) {
        confidence = 'unresolved';
        issue = 'More than one medication could match this wording.';
    }
    else if (!medication) {
        confidence = 'unresolved';
        issue = 'Medication not recognized. Choose a medication or confirm a custom name.';
    }
    if (!actionResult.action) {
        confidence = 'unresolved';
        issue = 'No current action was stated clearly.';
    }
    if (negated) {
        confidence = 'review';
        issue = 'This instruction negates an action. Confirm the intended current plan.';
    }
    else if (conditional) {
        confidence = 'review';
        issue = 'This appears conditional or future-facing and is not a current change.';
    }
    else if (historical) {
        confidence = 'review';
        issue = 'This appears to describe history, not necessarily a change today.';
    }
    if (actionResult.action === 'dose_change' && !details.newDose) {
        confidence = 'review';
        issue = 'Dose change detected, but the new dose was not clear.';
    }
    const medicationText = medication?.displayName
        ?? (matches.length > 0 ? matches.map(item => item.displayName).join(' / ') : extractUnknownMedicationText(text, actionResult.matchedText));
    if (!medicationText) {
        confidence = 'unresolved';
        issue = issue ?? 'Choose the medication this instruction refers to.';
    }
    // Never preselect negated, historical, conditional, ambiguous, or incomplete
    // statements. They stay visible until the clinician resolves or ignores them.
    const resolved = confidence === 'high';
    return {
        id: makeCandidateId(index, statement.start),
        medication,
        medicationAlternatives: matches.length > 1 ? matches : undefined,
        medicationText,
        action: negated || conditional || historical ? undefined : actionResult.action,
        doseDirection: actionResult.direction,
        confidence,
        sourceText: text,
        sourceStart: statement.start,
        sourceEnd: statement.end,
        issue,
        selected: resolved,
        resolved,
        ignored: false,
        ...details,
    };
}
function dedupeAndMarkConflicts(candidates) {
    const deduped = [];
    const exact = new Map();
    candidates.forEach(candidate => {
        const identity = candidate.medication
            ? `${candidate.medication.kind}:${candidate.medication.key}`
            : normalized(candidate.medicationText);
        const exactKey = [identity, candidate.action ?? 'unknown', candidate.newDose?.raw ?? '', candidate.frequency ?? '', candidate.reason?.text ?? ''].join('|');
        const prior = exact.get(exactKey);
        if (prior) {
            prior.duplicateCount = (prior.duplicateCount ?? 1) + 1;
            return;
        }
        exact.set(exactKey, candidate);
        deduped.push(candidate);
    });
    const byMedication = new Map();
    deduped.forEach(candidate => {
        const key = candidate.medication
            ? `${candidate.medication.kind}:${candidate.medication.key}`
            : normalized(candidate.medicationText);
        if (!key)
            return;
        const group = byMedication.get(key) ?? [];
        group.push(candidate);
        byMedication.set(key, group);
    });
    byMedication.forEach(group => {
        const actions = unique(group.map(item => item.action).filter((action) => Boolean(action)));
        const doses = unique(group.map(item => item.newDose?.raw).filter((dose) => Boolean(dose)));
        if (actions.length <= 1 && doses.length <= 1)
            return;
        group.forEach(candidate => {
            candidate.confidence = 'review';
            candidate.selected = false;
            candidate.resolved = false;
            candidate.issue = 'Conflicting instructions were found for this medication.';
        });
    });
    return deduped;
}
export class LocalRuleBasedParser {
    constructor(boundaryAliases = DEFAULT_BOUNDARY_ALIASES) {
        this.boundaryAliases = boundaryAliases;
    }
    parse(rawText) {
        const boundary = extractUpdateBoundary(rawText, this.boundaryAliases);
        if (!boundary.content.trim())
            return { boundary, candidates: [], notices: [] };
        const notices = [];
        const statements = splitStatements(boundary.content);
        const candidates = [];
        statements.forEach((statement, index) => {
            if (NO_CHANGE_LANGUAGE.test(statement.text)) {
                notices.push({ kind: 'no_change', text: statement.text.trim() });
                return;
            }
            const candidate = candidateForStatement(statement, index);
            if (candidate) {
                candidate.sourceStart += boundary.sourceOffset;
                candidate.sourceEnd += boundary.sourceOffset;
                candidates.push(candidate);
            }
        });
        return { boundary, candidates: dedupeAndMarkConflicts(candidates), notices };
    }
}
export function parseAvsLocally(rawText, aliases) {
    return new LocalRuleBasedParser(aliases).parse(rawText);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
export function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime()))
        return false;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}` === value;
}
function addLocalCalendarDays(date, days) {
    if (!isValidDateString(date))
        throw new Error('Choose a valid treatment start date.');
    const [year, month, day] = date.split('-').map(Number);
    const next = new Date(year, month - 1, day, 12);
    next.setDate(next.getDate() + days);
    return localDateString(next);
}
export function temporaryTreatmentFromPreset(presetId, startDate) {
    const preset = TEMPORARY_TREATMENT_PRESETS.find(item => item.id === presetId);
    if (!preset || !isValidDateString(startDate))
        return null;
    return {
        title: preset.title,
        kind: preset.kind,
        components: deepClone(preset.components),
        plannedStartDate: startDate,
        plannedEndDate: addLocalCalendarDays(startDate, (preset.inclusiveDayCount ?? 1) - 1),
        schedule: preset.schedule,
    };
}
export function validateProviderTemporaryTreatment(value) {
    const errors = [];
    if (!value.title.trim())
        errors.push('Enter the temporary treatment.');
    if (!isValidDateString(value.plannedStartDate) || !isValidDateString(value.plannedEndDate)) {
        errors.push('Choose valid temporary treatment dates.');
    }
    else if (value.plannedEndDate < value.plannedStartDate) {
        errors.push('Temporary treatment end date cannot be before its start date.');
    }
    if (!value.components.length || value.components.some(component => !component.labelSnapshot.trim())) {
        errors.push('The temporary treatment needs at least one named component.');
    }
    return errors;
}
export function validateProviderHandoff(raw) {
    if (!isRecord(raw))
        throw new Error('This handoff file is empty or invalid.');
    if (raw.schema !== PROVIDER_HANDOFF_SCHEMA)
        throw new Error('This is not an Ember Provider Handoff.');
    if (typeof raw.version !== 'number' || !SUPPORTED_PROVIDER_HANDOFF_VERSIONS.includes(raw.version)) {
        throw new Error('This handoff was made for an unsupported version of Ember.');
    }
    if (!isRecord(raw.createdBy) || !isRecord(raw.patientPlan)) {
        throw new Error('This handoff is missing provider or plan details.');
    }
}
export function parseProviderHandoffJson(rawText) {
    let parsed;
    try {
        const stripped = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const first = stripped.indexOf('{');
        const last = stripped.lastIndexOf('}');
        parsed = JSON.parse(first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped);
    }
    catch {
        throw new Error('Paste the complete Ember Provider Handoff text or choose its JSON file.');
    }
    validateProviderHandoff(parsed);
    return parsed;
}
function historyRecordFromActiveName(name, kind) {
    const normalizedResult = normalizeMedication(name, kind, name);
    const medication = normalizedResult.medication ?? {
        key: `custom-${kind}-${slug(name)}`,
        kind,
        displayName: name.trim(),
        handoffValue: name.trim(),
        category: kind === 'acute' ? 'Custom acute' : 'Custom preventive',
        custom: true,
    };
    return {
        id: `med-${kind}-${slug(medication.key)}`,
        medicationKey: medication.key,
        displayName: medication.displayName,
        handoffValue: medication.handoffValue,
        kind,
        category: medication.category,
        status: 'active',
        startDate: null,
        events: [],
    };
}
function validHistoryRecords(value) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value))
        throw new Error('This handoff has medication history Ember cannot safely update.');
    const valid = value.filter(item => (isRecord(item)
        && typeof item.id === 'string'
        && typeof item.medicationKey === 'string'
        && typeof item.displayName === 'string'
        && (item.kind === 'preventive' || item.kind === 'acute')
        && (item.status === 'active' || item.status === 'held' || item.status === 'stopped' || item.status === 'never_started')));
    if (valid.length !== value.length) {
        throw new Error('This handoff has a medication history record Ember cannot safely update.');
    }
    return valid.map(item => ({
        ...item,
        events: Array.isArray(item.events) ? item.events : [],
    }));
}
function validTemporaryTreatments(value) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value))
        throw new Error('This handoff has temporary treatments Ember cannot safely update.');
    const treatments = value.filter(item => (isRecord(item)
        && typeof item.title === 'string'
        && typeof item.plannedStartDate === 'string'
        && typeof item.plannedEndDate === 'string'
        && typeof item.schedule === 'string'
        && typeof item.kind === 'string'
        && Array.isArray(item.components)));
    if (treatments.length !== value.length || treatments.some(item => validateProviderTemporaryTreatment(item).length > 0)) {
        throw new Error('This handoff has a temporary treatment Ember cannot safely update.');
    }
    return deepClone(treatments);
}
export function upgradeProviderHandoff(raw) {
    validateProviderHandoff(raw);
    const upgraded = deepClone(raw);
    const plan = upgraded.patientPlan;
    const history = validHistoryRecords(plan.medicationHistory);
    const temporaryTreatments = validTemporaryTreatments(plan.temporaryTreatments);
    const seen = new Set(history.map(record => `${record.kind}:${record.medicationKey}`));
    const addActiveNames = (kind, names) => {
        if (!Array.isArray(names))
            return;
        names.filter(name => typeof name === 'string' && name.trim()).forEach(name => {
            const record = historyRecordFromActiveName(name, kind);
            const key = `${record.kind}:${record.medicationKey}`;
            if (seen.has(key))
                return;
            history.push(record);
            seen.add(key);
        });
    };
    addActiveNames('preventive', plan.preventiveMedications);
    addActiveNames('acute', plan.acuteMedications);
    upgraded.version = PROVIDER_HANDOFF_VERSION;
    plan.medicationHistory = history;
    plan.temporaryTreatments = temporaryTreatments;
    if (plan.followUpHistory !== undefined && !Array.isArray(plan.followUpHistory)) {
        throw new Error('This handoff has follow-up history Ember cannot safely update.');
    }
    if (!Array.isArray(plan.followUpHistory))
        plan.followUpHistory = [];
    if (!Array.isArray(plan.preventiveMedications))
        plan.preventiveMedications = [];
    if (!Array.isArray(plan.acuteMedications))
        plan.acuteMedications = [];
    return upgraded;
}
function recordMatchesMedication(record, medication) {
    return record.kind === medication.kind && (record.medicationKey === medication.key
        || normalized(record.displayName) === normalized(medication.displayName)
        || normalized(record.handoffValue) === normalized(medication.handoffValue));
}
function proposalEffect(action, status) {
    if (!action)
        return 'Needs clinician resolution before any update.';
    if (action === 'continue')
        return status === 'active'
            ? 'Keep current medication state. No history change.'
            : 'Leave this medication as-is. Ember will not change the current list.';
    if (action === 'stop')
        return 'End the current medication record on the encounter date and preserve it in history.';
    if (action === 'start')
        return 'Add this medication to the current plan using the encounter date.';
    if (action === 'restart')
        return 'Begin a new active episode while preserving earlier history.';
    if (action === 'dose_change')
        return 'Update the current dose or instructions and preserve the prior dose in history.';
    if (action === 'hold')
        return 'Leave this medication in its current list; the temporary hold remains in the patient instructions.';
    return 'Record that it was prescribed or planned but never started.';
}
export function reconcileMedicationActions(rawHandoff, parseResult) {
    const handoff = upgradeProviderHandoff(rawHandoff);
    const history = handoff.patientPlan.medicationHistory ?? [];
    const proposals = parseResult.candidates.map(candidate => {
        const proposal = deepClone(candidate);
        let record = proposal.medication
            ? history.find(item => recordMatchesMedication(item, proposal.medication))
            : undefined;
        if (!proposal.medication && proposal.medicationAlternatives?.length) {
            const existingMatches = proposal.medicationAlternatives
                .map(medication => ({ medication, record: history.find(item => recordMatchesMedication(item, medication)) }))
                .filter(item => item.record);
            if (existingMatches.length === 1) {
                proposal.medication = existingMatches[0].medication;
                proposal.medicationText = existingMatches[0].medication.displayName;
                record = existingMatches[0].record;
                proposal.confidence = 'review';
                proposal.selected = false;
                proposal.resolved = false;
                proposal.issue = 'Matched to the existing handoff state. Confirm this medication and action.';
            }
        }
        proposal.existingRecordId = record?.id;
        proposal.existingStatus = record?.status;
        if (proposal.action === 'dose_change' && !proposal.previousDose && record?.currentDose) {
            proposal.previousDose = deepClone(record.currentDose);
        }
        if (proposal.action === 'start' && record && ['stopped', 'held', 'never_started'].includes(record.status)) {
            proposal.action = 'restart';
        }
        const invalidAgainstState = ((proposal.action === 'start' && record?.status === 'active')
            || (proposal.action === 'continue' && (!record || record.status !== 'active'))
            || (proposal.action === 'stop' && (!record || record.status !== 'active'))
            || (proposal.action === 'dose_change' && (!record || !['active', 'held'].includes(record.status)))
            || (proposal.action === 'restart' && (!record || record.status === 'active'))
            || (proposal.action === 'hold' && (!record || record.status !== 'active'))
            || (proposal.action === 'never_started' && Boolean(record && record.status !== 'never_started')));
        if (invalidAgainstState) {
            proposal.confidence = 'review';
            proposal.selected = false;
            proposal.resolved = false;
            proposal.issue = 'This instruction does not cleanly match the existing handoff state. Confirm what should change.';
        }
        proposal.effect = proposalEffect(proposal.action, record?.status);
        return proposal;
    });
    return { handoff, proposals, notices: parseResult.notices };
}
/** Follow-up files are optional context. Without one, preserve the parser's
 * conservative confidence and describe the operation without pretending to
 * know whether the medication is currently active in the patient's app. */
export function proposeMedicationActions(parseResult) {
    const proposals = parseResult.candidates.map(candidate => {
        const proposal = deepClone(candidate);
        proposal.effect = proposalEffect(proposal.action);
        return proposal;
    });
    return {
        handoff: {
            schema: PROVIDER_HANDOFF_SCHEMA,
            version: PROVIDER_HANDOFF_VERSION,
            createdBy: {},
            patientPlan: {},
        },
        proposals,
        notices: parseResult.notices,
    };
}
export function customMedicationIdentity(label, kind) {
    const trimmed = label.trim();
    return {
        key: `custom-${kind}-${slug(trimmed)}`,
        kind,
        displayName: trimmed,
        handoffValue: trimmed,
        category: kind === 'acute' ? 'Custom acute' : 'Custom preventive',
        custom: true,
    };
}
export function resolveMedicationForReview(label, kind) {
    return normalizeMedication(label, kind, label).medication ?? customMedicationIdentity(label, kind);
}
function addUniqueActive(values, value) {
    const key = normalized(value);
    return values.some(item => normalized(item) === key) ? values : [...values, value];
}
function removeActive(values, record) {
    const identities = new Set([
        normalized(record.displayName),
        normalized(record.handoffValue),
        normalized(record.medicationKey),
    ]);
    return values.filter(value => !identities.has(normalized(value)));
}
function eventFromProposal(proposal, encounterDate, recordedAt, id) {
    return {
        id,
        action: proposal.action,
        encounterDate,
        recordedAt,
        doseDirection: proposal.doseDirection,
        previousDose: proposal.previousDose,
        newDose: proposal.newDose,
        frequency: proposal.frequency,
        prn: proposal.prn,
        route: proposal.route,
        instruction: proposal.instruction,
        reason: proposal.reason,
    };
}
function ensureRecord(history, proposal) {
    const medication = proposal.medication;
    const existing = history.find(record => recordMatchesMedication(record, medication));
    if (existing)
        return existing;
    const record = {
        id: `med-${medication.kind}-${slug(medication.key)}-${history.length + 1}`,
        medicationKey: medication.key,
        displayName: medication.displayName,
        handoffValue: medication.handoffValue,
        kind: medication.kind,
        category: medication.category,
        status: 'active',
        startDate: null,
        events: [],
    };
    history.push(record);
    return record;
}
export function validateResolvedProposals(proposals) {
    const errors = [];
    proposals.forEach((proposal, index) => {
        if (proposal.ignored)
            return;
        if (!proposal.resolved)
            errors.push(`Instruction ${index + 1} still needs review or must be ignored.`);
        if (proposal.selected && !proposal.medication)
            errors.push(`Instruction ${index + 1} needs a medication.`);
        if (proposal.selected && !proposal.action)
            errors.push(`Instruction ${index + 1} needs an action.`);
        if (proposal.selected && proposal.action === 'dose_change' && !proposal.newDose && !proposal.instruction) {
            errors.push(`Instruction ${index + 1} needs the new dose or instructions.`);
        }
    });
    return errors;
}
export function applyFollowUpChanges(rawHandoff, proposals, encounterDate, options = {}) {
    if (!isValidDateString(encounterDate))
        throw new Error('Choose a valid encounter date.');
    const errors = validateResolvedProposals(proposals);
    if (errors.length > 0)
        throw new Error(errors[0]);
    const handoff = upgradeProviderHandoff(rawHandoff);
    const plan = handoff.patientPlan;
    const history = plan.medicationHistory ?? [];
    const appliedAt = options.appliedAt ?? new Date().toISOString();
    const idSeed = options.idSeed ?? appliedAt.replace(/[^0-9]/g, '').slice(0, 14);
    let preventiveActive = [...(plan.preventiveMedications ?? [])];
    let acuteActive = [...(plan.acuteMedications ?? [])];
    const summaries = [];
    let eventIndex = 0;
    proposals.forEach(proposal => {
        if (!proposal.selected || proposal.ignored || !proposal.medication || !proposal.action)
            return;
        const record = ensureRecord(history, proposal);
        const activeValues = record.kind === 'preventive' ? preventiveActive : acuteActive;
        const eventId = proposal.action === 'continue' ? undefined : `event-${idSeed}-${eventIndex += 1}`;
        if (eventId)
            record.events.push(eventFromProposal(proposal, encounterDate, appliedAt, eventId));
        if (proposal.action === 'start' || proposal.action === 'restart') {
            record.status = 'active';
            record.startDate = encounterDate;
            delete record.stopDate;
            delete record.discontinuationReason;
            if (proposal.newDose)
                record.currentDose = proposal.newDose;
            if (proposal.frequency)
                record.currentFrequency = proposal.frequency;
            if (proposal.prn !== undefined)
                record.currentPrn = proposal.prn;
            if (proposal.route)
                record.currentRoute = proposal.route;
            if (proposal.instruction)
                record.currentInstruction = proposal.instruction;
            const next = addUniqueActive(activeValues, record.handoffValue);
            if (record.kind === 'preventive')
                preventiveActive = next;
            else
                acuteActive = next;
        }
        else if (proposal.action === 'continue') {
            record.status = 'active';
            const next = addUniqueActive(activeValues, record.handoffValue);
            if (record.kind === 'preventive')
                preventiveActive = next;
            else
                acuteActive = next;
        }
        else if (proposal.action === 'stop') {
            record.status = 'stopped';
            record.stopDate = encounterDate;
            if (proposal.reason)
                record.discontinuationReason = proposal.reason;
            const next = removeActive(activeValues, record);
            if (record.kind === 'preventive')
                preventiveActive = next;
            else
                acuteActive = next;
        }
        else if (proposal.action === 'hold') {
            record.status = 'held';
            // Held medications remain in the current arrays so mobile import does
            // not turn a temporary pause into permanent list removal.
            if (proposal.instruction)
                record.currentInstruction = proposal.instruction;
            const next = addUniqueActive(activeValues, record.handoffValue);
            if (record.kind === 'preventive')
                preventiveActive = next;
            else
                acuteActive = next;
        }
        else if (proposal.action === 'never_started') {
            record.status = 'never_started';
            record.startDate = null;
            delete record.stopDate;
            record.discontinuationReason = proposal.reason ?? { code: 'never_started', text: 'Never started' };
            const next = removeActive(activeValues, record);
            if (record.kind === 'preventive')
                preventiveActive = next;
            else
                acuteActive = next;
        }
        else if (proposal.action === 'dose_change') {
            record.status = record.status === 'stopped' || record.status === 'never_started' ? 'active' : record.status;
            if (proposal.newDose)
                record.currentDose = proposal.newDose;
            if (proposal.frequency)
                record.currentFrequency = proposal.frequency;
            if (proposal.prn !== undefined)
                record.currentPrn = proposal.prn;
            if (proposal.route)
                record.currentRoute = proposal.route;
            if (proposal.instruction)
                record.currentInstruction = proposal.instruction;
            const next = addUniqueActive(activeValues, record.handoffValue);
            if (record.kind === 'preventive')
                preventiveActive = next;
            else
                acuteActive = next;
        }
        summaries.push({
            medicationKey: record.medicationKey,
            displayName: record.displayName,
            kind: record.kind,
            action: proposal.action,
            eventId,
        });
    });
    plan.preventiveMedications = preventiveActive;
    plan.acuteMedications = acuteActive;
    plan.medicationHistory = history;
    plan.lastFollowUpDate = encounterDate;
    const followUpEntry = {
        id: `follow-up-${encounterDate}-${idSeed}`,
        encounterDate,
        appliedAt,
        changes: summaries,
    };
    plan.followUpHistory = [...(plan.followUpHistory ?? []), followUpEntry];
    handoff.updatedAt = appliedAt;
    handoff.version = PROVIDER_HANDOFF_VERSION;
    return handoff;
}
export function buildProviderHandoffUpdate(proposals, encounterDate, temporaryTreatments = [], createdAt = new Date().toISOString()) {
    if (!isValidDateString(encounterDate))
        throw new Error('Choose a valid encounter date.');
    const errors = validateResolvedProposals(proposals);
    if (errors.length > 0)
        throw new Error(errors[0]);
    const courseError = temporaryTreatments.flatMap(validateProviderTemporaryTreatment)[0];
    if (courseError)
        throw new Error(courseError);
    const medicationChanges = proposals
        .filter(proposal => proposal.selected && !proposal.ignored && proposal.medication && proposal.action)
        .map(proposal => ({
        medicationKey: proposal.medication.key,
        displayName: proposal.medication.displayName,
        handoffValue: proposal.medication.handoffValue,
        kind: proposal.medication.kind,
        category: proposal.medication.category,
        ...(proposal.medication.custom ? { custom: true } : {}),
        action: proposal.action,
        ...(proposal.doseDirection ? { doseDirection: proposal.doseDirection } : {}),
        ...(proposal.previousDose ? { previousDose: deepClone(proposal.previousDose) } : {}),
        ...(proposal.newDose ? { newDose: deepClone(proposal.newDose) } : {}),
        ...(proposal.frequency ? { frequency: proposal.frequency } : {}),
        ...(proposal.prn !== undefined ? { prn: proposal.prn } : {}),
        ...(proposal.route ? { route: proposal.route } : {}),
        ...(proposal.instruction ? { instruction: proposal.instruction } : {}),
        ...(proposal.reason ? { reason: deepClone(proposal.reason) } : {}),
    }));
    return {
        schema: PROVIDER_HANDOFF_UPDATE_SCHEMA,
        version: PROVIDER_HANDOFF_UPDATE_VERSION,
        createdAt,
        encounterDate,
        medicationChanges,
        temporaryTreatments: deepClone(temporaryTreatments),
    };
}
export function buildInitialMedicationHistory(preventiveMedications, acuteMedications) {
    return [
        ...preventiveMedications.map(name => historyRecordFromActiveName(name, 'preventive')),
        ...acuteMedications.map(name => historyRecordFromActiveName(name, 'acute')),
    ];
}
export function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
export const MEDICATION_OPTIONS = [
    ...TREATMENTS.preventive.map(item => identityFromTaxonomy(item, 'preventive')),
    ...TREATMENTS.acute.map(item => identityFromTaxonomy(item, 'acute')),
];
// Keep this reference live in the compiled module so build-time tree analysis
// cannot accidentally omit the shared registry.
void MEDICATION_TREATMENTS;
