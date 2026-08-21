PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS course (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  credits REAL NOT NULL CHECK (credits >= 0),
  description TEXT NOT NULL,
  CHECK (length(trim(code)) > 0),
  CHECK (length(trim(title)) > 0)
);

CREATE TABLE IF NOT EXISTS subject (
  name TEXT PRIMARY KEY,
  CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS course_subject (
  course_code TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
  subject_name TEXT NOT NULL REFERENCES subject(name) ON DELETE CASCADE,
  PRIMARY KEY (course_code, subject_name)
);

CREATE TABLE IF NOT EXISTS plan (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  major TEXT REFERENCES subject(name),
  minor TEXT REFERENCES subject(name),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS plan_item (
  plan_id INTEGER NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL REFERENCES course(code),
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
  trimester INTEGER NOT NULL CHECK (trimester BETWEEN 1 AND 3),
  PRIMARY KEY (plan_id, course_code)
);

CREATE INDEX IF NOT EXISTS course_subject_subject_idx
  ON course_subject(subject_name, course_code);

CREATE INDEX IF NOT EXISTS plan_item_term_idx
  ON plan_item(plan_id, year, trimester, course_code);

PRAGMA user_version = 1;
