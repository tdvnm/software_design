import { addOption, getElement } from '../lib/dom.js';
import { programmes } from '../data/programmes.js';

export const defaultPreferences = { major: 'computer science', minor: '', major2: 'mathematics', concentration: '', structure: 'single-major', fourYear: true };
export function activeProgrammes(preferences) {
    const picks = [{ subject: preferences.major, role: 'major' }];
    if (preferences.structure === 'double-major') picks.push({ subject: preferences.major2, role: 'major' });
    if (preferences.structure.includes('minor')) picks.push({ subject: preferences.minor, role: 'minor' });
    if (preferences.structure.includes('conc')) picks.push({ subject: preferences.concentration, role: 'concentration' });
    return picks.filter(pick => pick.subject);
}
export function requirementsFor(preferences) {
    return activeProgrammes(preferences).map(pick => {
        const years = preferences.fourYear ? 4 : 3;
        const name = pick.role === 'concentration' ? `Concentration (${years} Year)` : pick.role === 'minor' ? `Minor (${years} Year)` : `${years} Year ${preferences.structure === 'double-major' ? 'Double' : 'Single'} Major`;
        return { ...pick, ...(programmes[pick.subject]?.find(item => item.name === name) || { required: [] }) };
    });
}
export function makeCourseType(preferences, courses) {
    const aliases = new Map(courses.flatMap(c => (c.codes || [c.code]).map(code => [code, c.code])));
    const required = new Set(requirementsFor(preferences).flatMap(p => p.required).map(code => aliases.get(code.replaceAll(' ', ''))));
    const subjects = activeProgrammes(preferences).map(p => p.subject);
    return course => course.subjects.includes('core') ? 'core' : required.has(course.code) ? 'required' : course.subjects.some(subject => subjects.includes(subject)) ? 'elective' : 'other';
}
export function setupProgramme(subjects, preferences, onChange) {
    const majorSubjects = subjects.filter(s => !['core', 'foundation core', 'arts', 'business studies', 'philosophy'].includes(s));
    const otherSubjects = subjects.filter(s => !['core', 'foundation core'].includes(s));
    for (const id of ['major', 'major2', 'minor', 'concentration']) {
        const node = getElement(id);
        for (const subject of id.startsWith('major') ? majorSubjects : otherSubjects) addOption(node, subject);
        node.value = preferences[id];
    }
    function render() {
        getElement('structure').value = preferences.structure;
        getElement('four-year').checked = preferences.fourYear;
        getElement('minor').closest('label').hidden = !preferences.structure.includes('minor');
        getElement('major2-row').hidden = preferences.structure !== 'double-major';
        getElement('concentration-row').hidden = !preferences.structure.includes('conc');
        const used = new Set();
        for (const id of ['major', 'major2', 'minor', 'concentration']) {
            const node = getElement(id);
            if (node.closest('label').hidden) continue;
            for (const option of node.options) option.disabled = !!option.value && used.has(option.value);
            if (used.has(preferences[id])) preferences[id] = [...node.options].find(option => !option.disabled)?.value || '';
            node.value = preferences[id];
            if (preferences[id]) used.add(preferences[id]);
        }
        getElement('programme-summary').textContent = `${preferences.fourYear ? 4 : 3} years · ${activeProgrammes(preferences).map(p => p.subject).join(' + ') || 'undecided'}`;
    }
    for (const id of ['major', 'major2', 'minor', 'concentration', 'structure', 'four-year']) {
        getElement(id).addEventListener('change', event => {
            const key = id === 'four-year' ? 'fourYear' : id;
            preferences[key] = id === 'four-year' ? event.target.checked : event.target.value;
            render();
            onChange();
            render();
        });
    }
    render();
    return { render };
}
