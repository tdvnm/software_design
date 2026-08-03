import { readFileSync } from 'node:fs';
import { openDatabase } from './database.js';
import { readCourses } from '../dist/data/catalogue.js';

const courses = readCourses(readFileSync(new URL('../data/courses.csv', import.meta.url), 'utf8'));
const db = openDatabase();
try {
  if (db.prepare('SELECT COUNT(*) AS count FROM course').get().count > 0) {
    console.log('Course data already exists. Nothing changed.');
  } else {
    const insertCourse = db.prepare(
      'INSERT INTO course (code, title, credits, description) VALUES (?, ?, ?, ?)',
    );
    const insertSubject = db.prepare('INSERT OR IGNORE INTO subject (name) VALUES (?)');
    const insertLink = db.prepare(
      'INSERT INTO course_subject (course_code, subject_name) VALUES (?, ?)',
    );
    db.exec('BEGIN');
    try {
      for (const course of courses) {
        insertCourse.run(course.code, course.title, course.credits, course.description);
        for (const subject of course.subjects) {
          insertSubject.run(subject);
          insertLink.run(course.code, subject);
        }
      }
      db.exec('COMMIT');
      console.log(`Imported ${courses.length} courses.`);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
} finally {
  db.close();
}
