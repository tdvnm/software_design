import { makeDraggable } from '../lib/drag.js';
import { addOption, createButton, element, getElement } from '../lib/dom.js';

export function setupCatalogue(options) {
    const search = getElement('search');
    const subject = getElement('subject');
    options.subjects.forEach(value => addOption(subject, value));
    const list = getElement('catalogue');
    subject.value = options.getPreferences?.().major || ''; 
    function render() {
        const filterHost = getElement('quick-filters');
        const focusSubject = filterHost.contains(document.activeElement) ? document.activeElement.dataset.subject : undefined;
        // one chip per subject the student actually chose — a double major gets
        // both of its majors here, not just the first one
        const preferences = options.getPreferences?.() || {};
        const structure = preferences.structure || '';
        const chosen = [
            preferences.major,
            structure === 'double-major' ? preferences.major2 : '',
            structure.includes('minor') ? preferences.minor : '',
            structure.includes('conc') ? preferences.concentration : '',
        ].filter((value, index, all) => value && all.indexOf(value) === index);
        const short = value => value === 'computer science' ? 'comp' : value.split(' ')[0];
        const quick = [['', 'all'], ...chosen.map(value => [value, short(value)]), ['core', 'kccs']];
        filterHost.replaceChildren(...quick.map(([value, label]) => {
            const button = createButton(label, () => { subject.value = value; render(); });
            button.dataset.subject = value;
            button.setAttribute('aria-pressed', String(subject.value === value));
            return button;
        }));
        if (focusSubject !== undefined) [...filterHost.children].find(node => node.dataset.subject === focusSubject)?.focus();
        const query = search.value.trim().toLowerCase();
        const matches = options.courses.filter(course =>
            (!subject.value || course.subjects.includes(subject.value)) &&
            `${course.code} ${course.title} ${(course.codes || []).join(' ')}`.toLowerCase().includes(query));
        getElement('count').textContent = `${matches.length} course${matches.length === 1 ? '' : 's'}`;
        list.replaceChildren(...matches.map(course => {
            const row = element('li', 'catalogue-card');
            const placed = options.isPlaced?.(course.code) ?? false;
            row.dataset.code = course.code;
            makeDraggable(row, course);
            row.dataset.type = options.courseType?.(course) || (course.subjects.includes('core') ? 'core' : 'other');
            row.classList.toggle('is-placed', placed);
            row.classList.toggle('is-selected', options.getSelectedCode?.() === course.code);
            const info = createButton('', () => options.onDetails(course));
            info.className = 'course-info';
            info.setAttribute('aria-label', `Details for ${course.code}: ${course.title}`);
            info.append(element('strong', 'course-code', course.code), element('span', 'course-title', course.title));
            const footer = element('div', 'card-footer');
            const add = createButton(placed ? '✓ in plan' : '+ add', () => options.onAdd(course));
            add.className = 'add-course';
            add.disabled = placed;
            add.setAttribute('aria-label', placed ? `${course.code} is in your plan` : `Add ${course.code}`);
            footer.append(element('span', 'course-credits', `${course.credits} cr`), add);
            row.append(info, footer);
            return row;
        }));
        if (!matches.length) list.append(element('li', 'no-results', 'No courses here. Try another title, code or subject.'));
    }
    search.addEventListener('input', render);
    subject.addEventListener('change', render);
    render();
    return { render };
}
