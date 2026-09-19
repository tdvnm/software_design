import { renderHints } from './components/hints.js';
import { renderZoom } from './components/zoom.js';
import { loadSavedPlan, savePlan } from './storage.js';
import { loadCourses } from './data/catalogue.js';
import { addCourse, createPlan, removeCourse, moveCourse, terms } from './plan.js';
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
    let saved;
    let storageWarning = '';
    try { saved = loadSavedPlan(courses); }
    catch { storageWarning = 'Could not restore the saved plan. Changes will stay in this tab until you export them.'; }
    const plan = saved?.plan || createPlan();
    const preferences = saved?.preferences || { ...defaultPreferences };
    // Do not overwrite a damaged save or an unavailable storage area.
    let canSave = !storageWarning;
    function persist() {
        if (!canSave) return;
        try { savePlan(plan, preferences); }
        catch { canSave = false; storageWarning = 'Browser storage is unavailable. Export your plan before closing this tab.'; }
    }
    let catalogue;
    let selected;
    let zoom = null;
    const isPlaced = code => Object.values(plan).some(list => list.some(c => c.code === code));
    let classify = makeCourseType(preferences, courses);
    const courseType = course => classify(course);
    function select(course) {
        selected = course;
        showDetails(course, { onSelectCode: code => select(byCode.get(code)), hasCode: code => byCode.has(code), onMove: move, fourYear: preferences.fourYear, termId: Object.keys(plan).find(term => plan[term].some(c => c.code === course.code)) });
        document.querySelectorAll('[data-code]').forEach(node => node.classList.toggle('is-selected', node.dataset.code === course.code));
    }
    function move(code, termId) {
        const course = byCode.get(code);
        if (!course || !Object.hasOwn(plan, termId) || (!preferences.fourYear && termId.startsWith('4-'))) return;
        moveCourse(plan, termId, course);
        persist();
        refresh();
        status.textContent = `placed ${course.code} in ${terms.find(t => t.id === termId).label.toLowerCase()}`;
    }
    function refresh() {
        classify = makeCourseType(preferences, courses);
        renderHints(plan, courses, preferences);
        const boardOptions = { plan, fourYear: preferences.fourYear, courseType, onDetails: select, onMove: move,
            onZoom(termId) { zoom = termId; getElement('term').value = termId; refresh(); getElement('zoom').querySelector('button').focus(); },
            onRemove(termId, code) { removeCourse(plan, termId, code); persist(); status.textContent = `removed ${code}`; refresh(); }
        };
        renderBoard(boardOptions);
        renderZoom({ ...boardOptions, termId: zoom, onClose() { const previous = zoom; zoom = null; refresh(); document.querySelector(`[data-term="${previous}"] .zoom-button`)?.focus(); } });
        catalogue?.render();
        if (selected) select(selected);
    }
    setupProgramme(subjects, preferences, () => {
        if (!preferences.fourYear && Object.entries(plan).some(([term, list]) => term.startsWith('4-') && list.length)) {
            preferences.fourYear = true;
            status.textContent = 'Move the courses in year 4 before switching to three years.';
        } else status.textContent = 'programme updated · your courses stayed in place';
        persist();
        for (const option of getElement('term').options) option.hidden = !preferences.fourYear && option.value.startsWith('4-');
        if (!preferences.fourYear && zoom?.startsWith('4-')) zoom = null;
        if (!preferences.fourYear && getElement('term').value.startsWith('4-')) getElement('term').value = '3-3';
        refresh();
    });
    catalogue = setupCatalogue({ courses, subjects, terms, isPlaced, courseType, onDetails: select, onAdd(course, termId) {
        const added = addCourse(plan, termId, course);
        status.textContent = added ? `added ${course.code} to ${terms.find(t => t.id === termId).label.toLowerCase()}` : `${course.code} is already in the plan`;
        if (added) { refresh(); persist(); }
    } });
    refresh();
    getElement('workspace').disabled = false;
    status.textContent = storageWarning || 'saved on this browser · choose a course to start';
}
main().catch(error => {
    status.textContent = `Could not load courses: ${error.message || 'Unknown error.'} Reload to retry.`;
});
