import { loadCourses } from './data/catalogue.js';
import { addCourse, createPlan, removeCourse, terms } from './plan.js';
import { getElement } from './lib/dom.js';
import { setupProgramme } from './components/programme.js';
import { setupCatalogue } from './components/catalogue.js';
import { renderBoard } from './components/board.js';
import { showDetails } from './components/details.js';

const status = getElement('status');

async function main(): Promise<void> {
  const courses = await loadCourses();
  const subjects = [...new Set(courses.flatMap((course) => course.subjects))].sort();
  const plan = createPlan();

  function refreshBoard(): void {
    renderBoard({
      plan,
      onDetails: showDetails,
      onRemove(termId, code) {
        removeCourse(plan, termId, code);
        status.textContent = `Removed ${code}.`;
        refreshBoard();
      },
    });
  }

  setupProgramme(subjects);
  setupCatalogue({
    courses,
    subjects,
    terms,
    onDetails: showDetails,
    onAdd(course, termId) {
      const added = addCourse(plan, termId, course);
      status.textContent = added
        ? `Added ${course.code} to ${terms.find((term) => term.id === termId)?.label}.`
        : `${course.code} is already in the plan.`;
      if (added) refreshBoard();
    },
  });
  refreshBoard();
  getElement<HTMLFieldSetElement>('workspace').disabled = false;
  status.textContent = 'Choose a course and a trimester to start.';
}

main().catch((error) => {
  status.textContent = `Could not load courses: ${error instanceof Error ? error.message : 'Unknown error.'} Reload to retry.`;
});
