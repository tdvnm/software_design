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

import { foundationPlan, moveCourse } from '../dist/plan.js';
import { metadata } from '../dist/data/metadata.js';
import { restorePlan, serializePlan, loadSavedPlan, savePlan } from '../dist/storage.js';
import { getHints, programmeProgress } from '../dist/rules.js';
import { defaultPreferences } from '../dist/components/programme.js';
const catalogue = readCourses(readFileSync(new URL('../data/courses.csv', import.meta.url), 'utf8')).map(c => ({ ...c, ...metadata[c.code] }));

test('moving a course retains one placement and rejects an unknown trimester without losing it', () => {
  const plan = createPlan();
  const course = catalogue[0];
  addCourse(plan, '2-1', course);
  moveCourse(plan, '3-2', course);
  assert.equal(plan['2-1'].length, 0);
  assert.deepEqual(plan['3-2'], [course]);
  assert.throws(() => moveCourse(plan, '9-9', course), /Unknown term/);
  assert.deepEqual(plan['3-2'], [course]);
});

test('saved plans round-trip by course code and reject malformed or duplicate placements', () => {
  const plan = foundationPlan(catalogue);
  const raw = serializePlan(plan, { ...defaultPreferences, minor: 'history', structure: 'major-minor', theme: 'dark' });
  const restored = restorePlan(JSON.parse(JSON.stringify(raw)), catalogue);
  assert.deepEqual(restored.plan, plan);
  assert.equal(restored.preferences.minor, 'history');
  assert.equal(restored.preferences.theme, 'dark');
  assert.throws(() => restorePlan({ version: 2, plan: {} }, catalogue), /not a Tracey/);
  assert.throws(() => restorePlan({ version: 1, plan: { '5-1': [] } }, catalogue), /invalid trimester/);
  assert.throws(() => restorePlan({ version: 1, plan: { '1-1': ['FAKE101'] } }, catalogue), /Unknown course/);
  assert.throws(() => restorePlan({ version: 1, plan: { '1-1': ['KCCS101'], '1-2': ['KCCS101'] } }, catalogue), /twice/);
  const store = new Map();
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  savePlan(plan, raw.preferences, storage);
  assert.deepEqual(loadSavedPlan(catalogue, storage).plan, plan);
});

test('a restored fourth-year placement cannot disappear behind the three-year option', () => {
  const plan = createPlan();
  addCourse(plan, '4-1', catalogue[0]);
  const restored = restorePlan(serializePlan(plan, { ...defaultPreferences, fourYear: false }), catalogue);
  assert.equal(restored.preferences.fourYear, true);
  assert.equal(restored.plan['4-1'].length, 1);
});

test('foundation starter contains the twelve core courses exactly once', () => {
  const plan = foundationPlan(catalogue);
  const courses = Object.values(plan).flat();
  assert.equal(courses.length, 12);
  assert.equal(new Set(courses.map(c => c.code)).size, 12);
  assert.equal(countCredits(courses), 36);
  assert.equal(plan['1-1'].length, 4);
  assert.equal(plan['1-2'].length, 4);
  assert.equal(plan['3-1'][0].code, 'KCCS190');
});

test('prerequisites must precede a course and historical offering warnings are explicit', () => {
  const plan = createPlan();
  const first = { code: 'A101', codes: ['A101', 'ALT101'], subjects: ['mathematics'], credits: 4 };
  const next = { code: 'A201', subjects: ['mathematics'], credits: 4, prereqs: ['ALT101'], offered: [2], eligibleYears: [2, 3] };
  addCourse(plan, '2-1', next);
  addCourse(plan, '2-1', first);
  assert.ok(getHints(plan, [first, next], defaultPreferences).some(h => h.text.includes('needs ALT101')));
  moveCourse(plan, '1-3', first);
  assert.ok(!getHints(plan, [first, next], defaultPreferences).some(h => h.text.includes('needs ALT101')));
  assert.ok(getHints(plan, [first, next], defaultPreferences).some(h => h.text.includes('timetable snapshot')));
});

test('a heavy trimester reports its credit load', () => {
  const plan = createPlan();
  for (let i = 0; i < 6; i++) addCourse(plan, '2-1', { code: `X${i}`, credits: 4, subjects: ['mathematics'] });
  assert.ok(getHints(plan, [], defaultPreferences).some(h => h.text.includes('24 credits is above')));
  assert.ok(programmeProgress(plan, catalogue, defaultPreferences).every(p => p.done <= p.needed));
});
