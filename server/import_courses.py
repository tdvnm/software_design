import argparse
import csv
import io
import math
from pathlib import Path

from database import open_database

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "courses.csv"
HEADER = ["code", "title", "subjects", "credits", "description"]


def read_courses(text):
    """Parse the course CSV into rows ready for the relational schema."""
    try:
        rows = list(csv.reader(io.StringIO(text, newline=""), strict=True))
    except csv.Error as error:
        raise ValueError(f"Invalid course CSV: {error}") from None

    if not rows or [cell.lstrip("\ufeff") for cell in rows[0]] != HEADER:
        raise ValueError("Unexpected course CSV header.")

    courses = []
    codes = set()
    for row_number, row in enumerate(rows[1:], start=2):
        if len(row) != len(HEADER):
            raise ValueError(f"Invalid course CSV row {row_number}.")

        code, title, subjects, credits, description = row
        code = code.strip()
        title = title.strip()
        subject_names = [subject.strip().lower() for subject in subjects.split("|")]

        if not code or not title or not subject_names or not all(subject_names) or not credits.strip():
            raise ValueError(f"Invalid course CSV row {row_number}.")
        subject_names = list(dict.fromkeys(subject_names))
        if code in codes:
            raise ValueError(f"Duplicate course code {code!r} on row {row_number}.")
        try:
            credit_value = float(credits)
        except ValueError:
            raise ValueError(f"Invalid credits on course CSV row {row_number}.") from None
        if not math.isfinite(credit_value) or credit_value < 0:
            raise ValueError(f"Invalid credits on course CSV row {row_number}.")

        codes.add(code)
        courses.append((code, title, subject_names, credit_value, description))
    return courses


def import_courses(db, courses, replace=False):
    """Synchronise course rows in one transaction.

    Normal imports update the catalogue without touching saved plans. A full
    replacement is available for a clean rebuild, but is refused while plans
    exist because removing a course would invalidate their foreign keys.
    """
    if not courses:
        raise ValueError("The course CSV contains no courses.")

    if replace and db.execute("SELECT COUNT(*) FROM plan").fetchone()[0]:
        raise RuntimeError("Cannot replace course data while saved plans exist.")

    db.execute("BEGIN IMMEDIATE")
    try:
        if replace:
            db.execute("DELETE FROM course_subject")
            db.execute("DELETE FROM course")
            db.execute("DELETE FROM subject")

        for code, title, subjects, credits, description in courses:
            db.execute(
                """INSERT INTO course (code, title, credits, description)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(code) DO UPDATE SET
                     title = excluded.title,
                     credits = excluded.credits,
                     description = excluded.description""",
                (code, title, credits, description),
            )
            db.execute("DELETE FROM course_subject WHERE course_code = ?", (code,))
            for subject in subjects:
                db.execute("INSERT OR IGNORE INTO subject (name) VALUES (?)", (subject,))
                db.execute(
                    "INSERT INTO course_subject (course_code, subject_name) VALUES (?, ?)",
                    (code, subject),
                )

        db.execute("COMMIT")
    except Exception:
        db.execute("ROLLBACK")
        raise

    return len(courses)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Import course CSV data into Tracey's SQLite database.")
    parser.add_argument("--csv", type=Path, default=CSV_PATH, help="Course CSV file to import.")
    parser.add_argument("--replace", action="store_true", help="Rebuild catalogue tables from the CSV.")
    args = parser.parse_args(argv)

    courses = read_courses(args.csv.read_text(encoding="utf-8-sig"))
    db = open_database()
    try:
        count = import_courses(db, courses, replace=args.replace)
        action = "Rebuilt" if args.replace else "Imported"
        print(f"{action} {count} courses.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
