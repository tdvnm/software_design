import { addOption, createButton, getElement } from '../lib/dom.js';
import type { Course, Term } from '../types.js';

interface CatalogueOptions {
  courses: Course[];
  subjects: string[];
  terms: Term[];
  onAdd: (course: Course, termId: string) => void;
  onDetails: (course: Course) => void;
}

export function setupCatalogue(options: CatalogueOptions): void {
  const search = getElement<HTMLInputElement>('search');
  const subject = getElement<HTMLSelectElement>('subject');
  const term = getElement<HTMLSelectElement>('term');
  options.subjects.forEach((value) => addOption(subject, value));
  options.terms.forEach((value) => addOption(term, value.id, value.label));

  function render(): void {
    const query = search.value.trim().toLowerCase();
    const matches = options.courses.filter(
      (course) =>
        (!subject.value || course.subjects.includes(subject.value)) &&
        `${course.code} ${course.title}`.toLowerCase().includes(query),
    );
    getElement('count').textContent = matches.length
      ? `${matches.length} courses`
      : 'No courses found.';
    getElement('catalogue').replaceChildren(
      ...matches.map((course) => {
        const row = document.createElement('li');
        row.append(
          `${course.code} — ${course.title} (${course.credits} credits) `,
          createButton('Details', () => options.onDetails(course)),
          createButton('Add', () => options.onAdd(course, term.value)),
        );
        return row;
      }),
    );
  }
  search.addEventListener('input', render);
  subject.addEventListener('change', render);
  render();
}
