import sqlite3
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))

from database import open_database  # noqa: E402
from import_courses import import_courses, read_courses  # noqa: E402


class DatabaseImportTest(unittest.TestCase):
    def test_csv_rows_are_normalised_for_the_schema(self):
        courses = read_courses(
            "code,title,subjects,credits,description\n"
            " C101 , A course ,Science| science |Math,4,Text\n"
        )
        self.assertEqual(courses, [("C101", "A course", ["science", "math"], 4.0, "Text")])

    def test_import_populates_catalogue_and_can_be_repeated(self):
        db = open_database(":memory:")
        try:
            courses = read_courses(
                "code,title,subjects,credits,description\n"
                "C101,Intro,science|math,4,\n"
                "C102,Advanced,science,4,Details\n"
            )
            self.assertEqual(import_courses(db, courses), 2)
            self.assertEqual(import_courses(db, courses), 2)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM course").fetchone()[0], 2)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM subject").fetchone()[0], 2)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM course_subject").fetchone()[0], 3)
        finally:
            db.close()

    def test_invalid_csv_does_not_write_a_partial_batch(self):
        db = open_database(":memory:")
        try:
            with self.assertRaises(sqlite3.IntegrityError):
                import_courses(
                    db,
                    [
                        ("C101", "Valid", ["science"], 4.0, ""),
                        ("", "Invalid", ["science"], 4.0, ""),
                    ],
                )
            self.assertEqual(db.execute("SELECT COUNT(*) FROM course").fetchone()[0], 0)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
