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

export function moveCourse(plan, termId, course) {
    if (!Object.hasOwn(plan, termId)) throw new Error('Unknown term');
    for (const list of Object.values(plan)) {
        const index = list.findIndex(item => item.code === course.code);
        if (index !== -1) list.splice(index, 1);
    }
    plan[termId].push(course);
}

export function foundationPlan(courses) {
    const plan = createPlan();
    const core = courses.filter(c => c.subjects.includes('core')).sort((a, b) => a.code.localeCompare(b.code));
    let index = 0;
    for (const course of core) {
        const term = /engaging with the environment/i.test(course.title) ? `3-${course.offered?.[0] || 3}` : ['1-1', '1-2', '1-3', '2-1'][Math.min(3, Math.floor(index++ / 4))];
        plan[term].push(course);
    }
    return plan;
}
