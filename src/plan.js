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

// Graduation Requirements in the manual: 120 credits to finish the three-year
// programme, 160 for the four-year one, with ceilings of 128 and 176.
export const graduationCredits = fourYear => (fourYear === false ? 120 : 160);
export const creditCeiling = fourYear => (fourYear === false ? 128 : 176);

// Where a course should land when nobody picked a trimester: the first one it
// is actually offered in, in a year the student is eligible for, that still has
// room under the 20-credit limit.
export function suggestTerm(course, plan, fourYear = true) {
    const fits = terms.filter(term =>
        (fourYear !== false || term.year < 4) &&
        (!course.offered?.length || course.offered.includes(Number(term.id.split('-')[1]))) &&
        (!course.eligibleYears?.length || course.eligibleYears.includes(term.year)));
    return (fits.find(term => countCredits(plan[term.id]) < 20) || fits[0] || terms[0]).id;
}

export function moveCourse(plan, termId, course) {
    if (!Object.hasOwn(plan, termId)) throw new Error('Unknown term');
    for (const list of Object.values(plan)) {
        const index = list.findIndex(item => item.code === course.code);
        if (index !== -1) list.splice(index, 1);
    }
    plan[termId].push(course);
}

// The foundation year spreads the core courses over 1-1, 1-2, 1-3 and 2-1.
// Each core course only runs in some trimesters, so the courses with the least
// choice are placed first, each into the emptiest trimester that offers it.
const foundationTerms = ['1-1', '1-2', '1-3', '2-1'];
export function foundationPlan(courses) {
    const plan = createPlan();
    const core = courses.filter(c => c.subjects.includes('core'))
        .sort((a, b) => (a.offered?.length || 3) - (b.offered?.length || 3) || a.code.localeCompare(b.code));
    for (const course of core) {
        if (/engaging with the environment/i.test(course.title)) {
            plan[`3-${course.offered?.[0] || 3}`].push(course);
            continue;
        }
        const fits = foundationTerms.filter(id => !course.offered?.length || course.offered.includes(Number(id.at(-1))));
        const term = (fits.length ? fits : foundationTerms).reduce((a, b) => plan[b].length < plan[a].length ? b : a);
        plan[term].push(course);
    }
    return plan;
}
