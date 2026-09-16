import csv
import io
from pathlib import Path

from database import open_database

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "courses.csv"
HEADER = ["code", "title", "subjects", "credits", "description"]


def read_courses(text):
    rows = list(csv.reader(io.StringIO(text, newline="")))
    if not rows or rows[0] != HEADER:
        raise ValueError("Unexpected course CSV header.")
    courses = []
    for row in rows[1:]:
        if len(row) != 5 or not all(row[:3]):
            raise ValueError("Invalid course CSV row.")
        code, title, subjects, credits, description = row
        credits = float(credits)
        if credits < 0:
            raise ValueError("Invalid course CSV row.")
        courses.append((code, title, subjects.split("|"), credits, description))
    return courses


courses = read_courses(CSV_PATH.read_text(encoding="utf-8"))
db = open_database()
try:
    if db.execute("SELECT COUNT(*) FROM course").fetchone()[0] > 0:
        print("Course data already exists. Nothing changed.")
    else:
        db.execute("BEGIN")
        try:
            for code, title, subjects, credits, description in courses:
                db.execute(
                    "INSERT INTO course (code, title, credits, description) VALUES (?, ?, ?, ?)",
                    (code, title, credits, description),
                )
                for subject in subjects:
                    db.execute("INSERT OR IGNORE INTO subject (name) VALUES (?)", (subject,))
                    db.execute(
                        "INSERT INTO course_subject (course_code, subject_name) VALUES (?, ?)",
                        (code, subject),
                    )
            db.execute("COMMIT")
            print(f"Imported {len(courses)} courses.")
        except Exception:
            db.execute("ROLLBACK")
            raise
finally:
    db.close()
