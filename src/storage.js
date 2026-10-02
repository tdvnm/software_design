import { createPlan, terms } from './plan.js';
import { defaultPreferences } from './components/programme.js';
export const STORAGE_KEY = 'tracey-vanilla-plan-v1';
export function serializePlan(plan, preferences) {
    return { version: 1, preferences, plan: Object.fromEntries(terms.map(term => [term.id, plan[term.id].map(c => c.code)])) };
}
export function restorePlan(value, courses) {
    if (!value || value.version !== 1 || !value.plan || typeof value.plan !== 'object') throw new Error('This is not a Tracey plan file.');
    const plan = createPlan();
    const byCode = new Map(courses.map(c => [c.code, c]));
    const seen = new Set();
    for (const [term, codes] of Object.entries(value.plan)) {
        if (!Object.hasOwn(plan, term) || !Array.isArray(codes)) throw new Error('The plan contains an invalid trimester.');
        for (const code of codes) {
            if (!byCode.has(code)) throw new Error(`Unknown course: ${code}`);
            if (seen.has(code)) throw new Error(`${code} is in the plan twice.`);
            seen.add(code);
            plan[term].push(byCode.get(code));
        }
    }
    const preferences = { ...defaultPreferences };
    const subjects = new Set(courses.flatMap(c => c.subjects));
    const raw = value.preferences || {};
    for (const key of ['major', 'major2', 'minor', 'concentration']) {
        if (raw[key] === '' || subjects.has(raw[key])) preferences[key] = raw[key];
    }
    if (['single-major', 'double-major', 'major-minor', 'major-conc', 'major-minor-conc'].includes(raw.structure)) preferences.structure = raw.structure;
    if (typeof raw.fourYear === 'boolean') preferences.fourYear = raw.fourYear;
    if (terms.some(t => t.year === 4 && plan[t.id].length)) preferences.fourYear = true;
    for (const key of ['showCodes', 'showTitles']) if (typeof raw[key] === 'boolean') preferences[key] = raw[key];
    if (preferences.showCodes === false && preferences.showTitles !== true) preferences.showCodes = true;
    if (['light', 'dark'].includes(raw.theme)) preferences.theme = raw.theme;
    return { plan, preferences };
}
export function loadSavedPlan(courses, storage = localStorage) {
    const text = storage.getItem(STORAGE_KEY);
    return text ? restorePlan(JSON.parse(text), courses) : { plan: createPlan(), preferences: { ...defaultPreferences } };
}
export function savePlan(plan, preferences, storage = localStorage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(serializePlan(plan, preferences)));
}
