import { makeDraggable, makeDropTarget } from '../lib/drag.js';
import { createButton, element, getElement } from '../lib/dom.js';
import { countCredits, graduationCredits, terms, years } from '../plan.js';

export function renderBoard(options) {
    const { plan, onRemove, onDetails } = options;
    const rows = years.filter(year => options.fourYear !== false || year < 4).map(year => {
        const row = element('tr');
        const heading = element('th', 'year-label', `y${year}`);
        heading.scope = 'row';
        row.append(heading);
        for (const term of terms.filter(term => term.year === year)) {
            const cell = element('td', 'term-cell');
            cell.dataset.term = term.id;
            cell.dataset.trimester = term.id.split('-')[1];
            makeDropTarget(cell, code => options.onMove?.(code, term.id));
            cell.setAttribute('aria-label', term.label);
            const stack = element('div', 'term-courses');
            for (const course of plan[term.id]) {
                const item = element('div', 'course-chip');
                item.dataset.code = course.code;
                makeDraggable(item, course);
                item.dataset.type = options.courseType?.(course) || (course.subjects.includes('core') ? 'core' : 'other');
                const label = [options.showCodes !== false ? course.code : '', options.showTitles ? course.title : ''].filter(Boolean).join(' · ');
                const details = createButton(label, () => onDetails(course));
                details.className = 'chip-label';
                details.title = course.title;
                const remove = createButton('×', () => onRemove(term.id, course.code));
                remove.className = 'chip-remove';
                remove.setAttribute('aria-label', `Remove ${course.code}`);
                item.append(details, remove);
                stack.append(item);
            }
            const credits = countCredits(plan[term.id]);
            const summary = element('div', 'term-summary');
            summary.append(element('span', '', `${credits} cr`));
            const open = createButton('↗', () => options.onZoom?.(term.id));
            open.className = 'zoom-button';
            open.setAttribute('aria-label', `Open ${term.label}`);
            summary.append(open);
            if (!credits) stack.append(element('span', 'term-placeholder', 'add a course'));
            cell.append(stack, summary);
            row.append(cell);
        }
        return row;
    });
    getElement('board').replaceChildren(...rows);
    const planned = countCredits(Object.values(plan).flat());
    const target = graduationCredits(options.fourYear);
    const left = target - planned;
    getElement('total').textContent = left > 0
        ? `${planned} of ${target} credits planned · ${left} to go`
        : `${planned} of ${target} credits planned · ${left === 0 ? 'minimum met' : `${-left} over the minimum`}`;
    getElement('plan-empty').hidden = Object.values(plan).some(courses => courses.length > 0);
}
