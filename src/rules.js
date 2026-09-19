import { countCredits, terms } from './plan.js';
import { requirementsFor } from './components/programme.js';

// These are planning hints from Tracey's catalogue snapshot, not degree approval.
export function getHints(plan, courses, preferences) {
    const hints = [];
    const placements = new Map();
    for (const [term, list] of Object.entries(plan)) for (const course of list) {
        for (const code of course.codes || [course.code]) placements.set(code, term);
    }
    const ordinal = term => { const [y, t] = term.split('-').map(Number); return y * 3 + t; };
    let heavy = 0;
    for (const term of terms.filter(t => preferences.fourYear || t.year < 4)) {
        const list = plan[term.id];
        const credits = countCredits(list);
        if (credits > 16) heavy++;
        if (credits > 20) hints.push({ kind: 'warn', text: `${term.label}: ${credits} credits is above the 20-credit limit.` });
        else if (credits > 16) hints.push({ kind: 'caution', text: `${term.label}: ${credits} credits is a heavy trimester.` });
        else if (credits > 0 && credits < 12) hints.push({ kind: 'caution', text: `${term.label}: ${12 - credits} more credits to reach 12.` });
        if (term.year === 1 && !term.id.endsWith('-3') && list.some(c => !c.subjects.includes('core'))) hints.push({ kind: 'warn', text: `${term.label} is reserved for foundation core courses.` });
        for (const course of list) {
            if (course.eligibleYears?.length && !course.eligibleYears.includes(term.year)) hints.push({ kind: 'warn', text: `${course.code} is not listed for year ${term.year}.` });
            if (course.offered?.length && !course.offered.includes(Number(term.id.at(-1)))) hints.push({ kind: 'info', text: `${course.code} has not appeared in t${term.id.at(-1)} in the timetable snapshot. Check the current offering.` });
            for (const prerequisite of course.prereqs || []) {
                if (!placements.has(prerequisite) || ordinal(placements.get(prerequisite)) >= ordinal(term.id)) hints.push({ kind: 'warn', text: `${course.code} needs ${prerequisite} in an earlier trimester.` });
            }
        }
    }
    if (heavy > 2) hints.push({ kind: 'warn', text: 'More than two trimesters exceed the recommended 16-credit load.' });
    const total = countCredits(Object.values(plan).flat());
    const cap = preferences.fourYear ? 176 : 128;
    if (total > cap) hints.push({ kind: 'warn', text: `${total} credits is above the ${cap}-credit programme ceiling.` });
    const coreLeft = courses.filter(c => c.subjects.includes('core') && !placements.has(c.code)).length;
    if (coreLeft) hints.push({ kind: 'info', text: `${coreLeft} foundation core course${coreLeft === 1 ? '' : 's'} still to place.` });
    return hints;
}
export function programmeProgress(plan, courses, preferences) {
    const placed = new Set(Object.values(plan).flat().flatMap(c => c.codes || [c.code]));
    const known = new Set(courses.flatMap(c => c.codes || [c.code]));
    return requirementsFor(preferences).map(programme => {
        const codes = programme.required.map(c => c.replaceAll(' ', ''));
        return { ...programme, done: codes.filter(c => placed.has(c)).length, needed: codes.length, missingFromCatalogue: codes.filter(c => !known.has(c)) };
    });
}
