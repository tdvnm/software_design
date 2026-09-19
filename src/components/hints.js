import { element, getElement } from '../lib/dom.js';
import { countCredits } from '../plan.js';
import { getHints, programmeProgress } from '../rules.js';
export function renderHints(plan, courses, preferences) {
    const host = getElement('hints');
    const placed = Object.values(plan).flat();
    const stats = element('div', 'plan-stats');
    for (const [value, label] of [[countCredits(placed), 'credits planned'], [placed.length, 'courses placed']]) {
        const stat = element('div');
        stat.append(element('strong', '', String(value)), element('span', '', label));
        stats.append(stat);
    }
    host.replaceChildren(stats);
    for (const progress of programmeProgress(plan, courses, preferences)) {
        const row = element('div', 'programme-progress');
        row.append(element('strong', '', progress.subject), element('small', 'muted', `${progress.role} · ${progress.done}/${progress.needed} listed requirements placed`));
        const meter = element('progress');
        meter.max = Math.max(progress.needed, 1); meter.value = progress.done;
        meter.setAttribute('aria-label', `${progress.subject} listed requirements`);
        row.append(meter);
        if (progress.additional) row.append(element('small', 'muted', progress.additional));
        host.append(row);
    }
    const hints = getHints(plan, courses, preferences);
    for (const hint of hints) host.append(element('p', `hint hint-${hint.kind}`, hint.text));
    host.append(element('p', 'hint-footnote muted', 'Based on the catalogue snapshot. Choice pools and substitutions still need a mentor’s check.'));
}
