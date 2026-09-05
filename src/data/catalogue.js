import { metadata } from './metadata.js';
import { parseCsv } from '../lib/csv.js';
export function readCourses(text) {
    const [header, ...rows] = parseCsv(text);
    if (header?.join(',') !== 'code,title,subjects,credits,description') {
        throw new Error('Unexpected course CSV header.');
    }
    return rows.map(row => {
        const [code, title, subjects, credits, description] = row;
        if (row.length !== 5 || !code || !title || !subjects || !credits.trim() ||
            !Number.isFinite(Number(credits)) || Number(credits) < 0) {
            throw new Error('Invalid course CSV row.');
        }
        return { code, title, subjects: subjects.split('|'), credits: Number(credits), description };
    });
}
export async function loadCourses() {
    const response = await fetch('/api/courses');
    if (!response.ok)
        throw new Error(`Course download failed (${response.status}).`);
    const courses = await response.json();
    if (courses.length === 0)
        throw new Error('The database has no courses. Run npm run db:import.');
    return courses.map(course => ({ ...course, ...metadata[course.code] }));
}
