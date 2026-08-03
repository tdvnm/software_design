import { parseCsv } from '../lib/csv.js';
import type { Course } from '../types.js';

export function readCourses(text: string): Course[] {
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

export async function loadCourses(): Promise<Course[]> {
  const response = await fetch('/data/courses.csv');
  if (!response.ok) throw new Error(`Course download failed (${response.status}).`);
  return readCourses(await response.text());
}
