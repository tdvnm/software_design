import { loadCourses } from './data/catalogue.js';
import { addCourse, createPlan, removeCourse, terms } from './plan.js';
import { getElement } from './lib/dom.js';
import { defaultPreferences, makeCourseType, setupProgramme } from './components/programme.js';
import { setupCatalogue } from './components/catalogue.js';
import { renderBoard } from './components/board.js';
import { showDetails } from './components/details.js';

const status = getElement('status');
async function main() {
    const courses = await loadCourses();
    const byCode = new Map(courses.flatMap(c => (c.codes || [c.code]).map(code => [code, c])));
    const subjects = [...new Set(courses.flatMap(course => course.subjects))].sort();
    const plan = createPlan();
    const preferences = { ...defaultPreferences };
    let catalogue;
    let selected;
    const isPlaced = code => Object.values(plan).some(list => list.some(c => c.code === code));
    const courseType = course => makeCourseType(preferences, courses)(course);
    function select(course) {
        selected = course;
        showDetails(course, { onSelectCode: code => select(byCode.get(code)), hasCode: code => byCode.has(code) });
        document.querySelectorAll('[data-code]').forEach(node => node.classList.toggle('is-selected', node.dataset.code === course.code));
    }
    function refresh() {
        renderBoard({ plan, fourYear: preferences.fourYear, courseType, onDetails: select, onRemove(termId, code) {
            removeCourse(plan, termId, code);
            status.textContent = `removed ${code}`;
            refresh();
        } });
        catalogue?.render();
        if (selected) select(selected);
    }
    setupProgramme(subjects, preferences, () => {
        if (!preferences.fourYear && Object.entries(plan).some(([term, list]) => term.startsWith('4-') && list.length)) {
            preferences.fourYear = true;
            status.textContent = 'Move the courses in year 4 before switching to three years.';
        } else status.textContent = 'programme updated · your courses stayed in place';
        for (const option of getElement('term').options) option.hidden = !preferences.fourYear && option.value.startsWith('4-');
        if (!preferences.fourYear && getElement('term').value.startsWith('4-')) getElement('term').value = '3-3';
        refresh();
    });
    catalogue = setupCatalogue({ courses, subjects, terms, isPlaced, courseType, onDetails: select, onAdd(course, termId) {
        const added = addCourse(plan, termId, course);
        status.textContent = added ? `added ${course.code} to ${terms.find(t => t.id === termId).label.toLowerCase()}` : `${course.code} is already in the plan`;
        if (added) refresh();
    } });
    refresh();
    getElement('workspace').disabled = false;
    status.textContent = 'choose a course and a trimester to start';
}
main().catch(error => {
    status.textContent = `Could not load courses: ${error.message || 'Unknown error.'} Reload to retry.`;
});
