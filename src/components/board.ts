import { createButton, getElement } from '../lib/dom.js';
import { countCredits, terms, years } from '../plan.js';
import type { Course, Plan } from '../types.js';

interface BoardOptions {
  plan: Plan;
  onRemove: (termId: string, code: string) => void;
  onDetails: (course: Course) => void;
}

export function renderBoard({ plan, onRemove, onDetails }: BoardOptions): void {
  const rows = years.map((year) => {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = `Year ${year}`;
    row.append(heading);
    for (const term of terms.filter((term) => term.year === year)) {
      const cell = document.createElement('td');
      for (const course of plan[term.id]) {
        const item = document.createElement('div');
        item.append(
          createButton(course.code, () => onDetails(course)),
          createButton(`Remove ${course.code}`, () => onRemove(term.id, course.code)),
        );
        cell.append(item);
      }
      const summary = document.createElement('p');
      summary.textContent = `${countCredits(plan[term.id])} credits`;
      cell.append(summary);
      row.append(cell);
    }
    return row;
  });
  getElement('board').replaceChildren(...rows);
  getElement('total').textContent =
    `Total planned credits: ${countCredits(Object.values(plan).flat())}`;
  getElement('plan-empty').hidden = Object.values(plan).some((courses) => courses.length > 0);
}
