import type { Course, Plan, Term } from './types.js';

export const years = [1, 2, 3, 4];
export const terms: Term[] = years.flatMap((year) =>
  [1, 2, 3].map((trimester) => ({
    id: `${year}-${trimester}`,
    year,
    label: `Year ${year}, T${trimester}`,
  })),
);

export function createPlan(): Plan {
  return Object.fromEntries(terms.map((term) => [term.id, []]));
}

export function addCourse(plan: Plan, termId: string, course: Course): boolean {
  if (!plan[termId]) throw new Error('Unknown term');
  if (Object.values(plan).some((courses) => courses.some((item) => item.code === course.code)))
    return false;
  plan[termId].push(course);
  return true;
}

export function removeCourse(plan: Plan, termId: string, code: string): void {
  plan[termId] = plan[termId].filter((course) => course.code !== code);
}

export function countCredits(courses: Course[]): number {
  return courses.reduce((total, course) => total + course.credits, 0);
}
