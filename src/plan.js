export const years = [1, 2, 3, 4];
export const terms = years.flatMap((year) => [1, 2, 3].map((trimester) => ({
    id: `${year}-${trimester}`,
    year,
    label: `Year ${year}, T${trimester}`,
})));
export function createPlan() {
    return Object.fromEntries(terms.map((term) => [term.id, []]));
}
export function addCourse(plan, termId, course) {
    if (!plan[termId])
        throw new Error('Unknown term');
    if (Object.values(plan).some((courses) => courses.some((item) => item.code === course.code)))
        return false;
    plan[termId].push(course);
    return true;
}
export function removeCourse(plan, termId, code) {
    plan[termId] = plan[termId].filter((course) => course.code !== code);
}
export function countCredits(courses) {
    return courses.reduce((total, course) => total + course.credits, 0);
}
