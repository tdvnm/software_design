import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseCsv } from '../dist/lib/csv.js';
import { readCourses } from '../dist/data/catalogue.js';
import { addCourse, countCredits, createPlan, removeCourse } from '../dist/plan.js';

test('CSV reads commas, doubled quotes and newlines inside quoted fields', () => {
  assert.deepEqual(parseCsv('a,b\r\n"comma, quote ""yes""","two\nlines"\r\n'), [
    ['a', 'b'],
    ['comma, quote "yes"', 'two\nlines'],
  ]);
  assert.throws(() => parseCsv('"unfinished'), /Unclosed quote/);
});

test('the catalogue has distinct courses with valid numeric credits', () => {
  const courses = readCourses(
    readFileSync(new URL('../data/courses.csv', import.meta.url), 'utf8'),
  );
  assert.equal(courses.length, 474);
  assert.equal(new Set(courses.map((course) => course.code)).size, courses.length);
  assert.ok(courses.every((course) => Number.isFinite(course.credits) && course.credits >= 0));
  assert.throws(
    () => readCourses('code,title,subjects,credits,description\nC,Course,science,no,Text'),
    /Invalid course/,
  );
});

test('adding the same course to another term cannot double-count its credits', () => {
  const plan = createPlan();
  const course = {
    code: 'COMP201',
    title: 'Example',
    subjects: ['computer science'],
    credits: 4,
    description: '',
  };
  assert.equal(addCourse(plan, '1-1', course), true);
  assert.equal(addCourse(plan, '2-1', course), false);
  assert.equal(countCredits(Object.values(plan).flat()), 4);
  removeCourse(plan, '1-1', course.code);
  assert.equal(countCredits(Object.values(plan).flat()), 0);
  assert.equal(addCourse(plan, '2-1', course), true);
  assert.equal(createPlan()['2-1'].length, 0);
});
