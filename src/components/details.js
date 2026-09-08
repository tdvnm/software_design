import { createButton, element, getElement } from '../lib/dom.js';

export function showDetails(course, options = {}) {
    const header = element('div', 'detail-card');
    header.append(element('strong', 'detail-code', course.code), element('h3', '', course.title));
    if (course.codes?.length > 1) header.append(element('small', 'muted', course.codes.join(' · ')));
    const stats = element('div', 'detail-stats');
    for (const [label, value] of [['credits', course.credits], ['offered', course.offered?.map(t => `t${t}`).join(' ') || '—'], ['years', course.eligibleYears?.join(', ') || '—']]) {
        const stat = element('div', 'detail-stat');
        stat.append(element('small', '', label), element('strong', '', String(value)));
        stats.append(stat);
    }
    const body = getElement('details');
    body.replaceChildren(header, stats, element('p', 'detail-subjects muted', course.subjects.join(' · ')));
    if (course.description && course.description !== '-') {
        body.append(element('h4', 'section-label', 'about'), element('p', 'detail-description', course.description));
    }
    if (course.faculty) body.append(element('p', 'detail-faculty muted', `recently taught by ${course.faculty}`));
    for (const [label, codes] of [['needs first', course.prereqs], ['unlocks', course.unlocks]]) {
        if (!codes?.length) continue;
        const chips = element('div', 'detail-links');
        for (const code of codes) {
            const button = createButton(code, () => options.onSelectCode?.(code));
            button.disabled = !options.onSelectCode || (options.hasCode && !options.hasCode(code));
            chips.append(button);
        }
        body.append(element('h4', 'section-label', label), chips);
    }
}
