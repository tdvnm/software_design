import { getElement } from '../lib/dom.js';
import type { Course } from '../types.js';

export function showDetails(course: Course): void {
  const title = document.createElement('h3');
  title.textContent = `${course.code}: ${course.title}`;
  const info = document.createElement('p');
  info.textContent = `${course.subjects.join(', ')} | ${course.credits} credits`;
  const description = document.createElement('p');
  description.textContent = course.description || 'No description available.';
  getElement('details').replaceChildren(title, info, description);
}
