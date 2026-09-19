import { createButton, element, getElement } from '../lib/dom.js';
import { makeDraggable, makeDropTarget } from '../lib/drag.js';
import { countCredits, terms } from '../plan.js';

export function renderZoom(options) {
    const { termId, plan, onClose, onDetails, onMove, onRemove, courseType } = options;
    const host = getElement('zoom');
    host.replaceChildren();
    host.hidden = !termId;
    getElement('overview').hidden = !!termId;
    if (!termId) return;
    const term = terms.find(t => t.id === termId);
    const header = element('div', 'zoom-heading');
    const back = createButton('← all trimesters', onClose);
    header.append(back, element('h3', '', term.label.toLowerCase()), element('span', 'muted', `${countCredits(plan[termId])} credits`));
    const grid = element('div', 'zoom-grid');
    grid.setAttribute('aria-label', term.label);
    makeDropTarget(grid, code => onMove(code, termId));
    for (const course of plan[termId]) {
        const card = element('div', 'zoom-course');
        card.dataset.type = courseType(course);
        card.style.gridColumn = `span ${Math.min(4, Math.max(1, Math.ceil(course.credits)))}`;
        makeDraggable(card, course);
        const details = createButton('', () => onDetails(course));
        details.className = 'zoom-course-details';
        details.append(element('strong', '', course.code), element('span', '', course.title), element('small', 'muted', `${course.credits} credits`));
        const remove = createButton('×', () => onRemove(termId, course.code));
        remove.className = 'zoom-remove';
        remove.setAttribute('aria-label', `Remove ${course.code}`);
        card.append(details, remove);
        grid.append(card);
    }
    if (!plan[termId].length) grid.append(element('p', 'zoom-empty muted', 'drop a course here, or use add in the catalogue'));
    host.append(header, grid, element('p', 'zoom-note muted', 'Card width follows course credits. Courses can be moved again at any time.'));
}
