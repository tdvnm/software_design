import json
import sys
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))

from app import create_server  # noqa: E402
from database import open_database  # noqa: E402


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = open_database(":memory:")
        cls.server = create_server(cls.db, port=0)
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.db.close()

    def request(self, path, method="GET", body=None):
        data = json.dumps(body).encode() if body is not None else None
        headers = {"Content-Type": "application/json"} if data else {}
        try:
            with urlopen(Request(self.base + path, data=data, method=method, headers=headers)) as response:
                return response.status, dict(response.headers), response.read()
        except HTTPError as error:
            return error.code, dict(error.headers), error.read()

    def json(self, path, method="GET", body=None):
        status, _, raw = self.request(path, method, body)
        return status, json.loads(raw) if raw else None

    def seed_course(self):
        self.db.executescript(
            """INSERT OR IGNORE INTO course (code, title, credits, description) VALUES ('CS101', 'Intro to CS', 4, 'Basics.');
               INSERT OR IGNORE INTO subject (name) VALUES ('Computer Science');
               INSERT OR IGNORE INTO course_subject (course_code, subject_name) VALUES ('CS101', 'Computer Science');"""
        )

    def test_planner_about_and_documents_are_served(self):
        status, _, body = self.request("/")
        self.assertEqual(status, 200)
        self.assertIn(b'id="board"', body)

        status, headers, body = self.request("/about")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn(b"About Tracey", body)

        status, headers, body = self.request("/docs/sequence-diagram.svg")
        self.assertEqual(status, 200)
        self.assertIn("image/svg+xml", headers["Content-Type"])
        self.assertIn(b"<svg", body)

        status, headers, body = self.request("/docs/hw1-proposal.pdf", "HEAD")
        self.assertEqual(status, 200)
        self.assertIn("application/pdf", headers["Content-Type"])
        self.assertEqual(body, b"")

    def test_only_images_and_pdfs_under_docs_are_public(self):
        for path in [
            "/docs/course-map.md",
            "/docs/sequence-diagram.mmd",
            "/docs/%2e%2e/server/schema.sql",
            "/docs/%2e%2e/package.json",
            "/server/schema.sql",
            "/data/tracey.sqlite",
        ]:
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 404)

    def test_health_check_reads_sqlite(self):
        status, body = self.json("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(body, {"status": "ok", "database": "sqlite", "stage": "setup"})

    def test_courses_come_from_sqlite_with_subjects_joined(self):
        self.seed_course()
        status, body = self.json("/api/courses")
        self.assertEqual(status, 200)
        self.assertIn(
            {"code": "CS101", "title": "Intro to CS", "credits": 4, "description": "Basics.", "subjects": ["Computer Science"]},
            body,
        )

    def test_plan_is_created_holds_placements_and_is_patched(self):
        self.seed_course()
        status, plan = self.json("/api/plans", "POST", {"name": "My plan"})
        self.assertEqual(status, 201)
        self.assertEqual(plan["name"], "My plan")
        self.assertIsNone(plan["major"])
        self.assertEqual(plan["items"], [])
        plan_id = plan["id"]

        status, placed = self.json(f"/api/plans/{plan_id}/items/CS101", "PUT", {"year": 1, "trimester": 1})
        self.assertEqual(status, 200)
        self.assertEqual(placed["items"], [{"course_code": "CS101", "year": 1, "trimester": 1}])

        status, moved = self.json(f"/api/plans/{plan_id}/items/CS101", "PUT", {"year": 2, "trimester": 3})
        self.assertEqual(status, 200)
        self.assertEqual(moved["items"], [{"course_code": "CS101", "year": 2, "trimester": 3}])

        status, patched = self.json(f"/api/plans/{plan_id}", "PATCH", {"major": "Computer Science"})
        self.assertEqual(status, 200)
        self.assertEqual(patched["major"], "Computer Science")

        status, _, body = self.request(f"/api/plans/{plan_id}/items/CS101", "DELETE")
        self.assertEqual(status, 204)
        self.assertEqual(body, b"")
        status, fetched = self.json(f"/api/plans/{plan_id}")
        self.assertEqual(fetched["items"], [])

        self.assertEqual(self.json("/api/plans/999999")[0], 404)

    def test_invalid_input_is_rejected_not_crashed_on(self):
        self.seed_course()
        self.assertEqual(self.json("/api/plans", "POST", {"name": ""})[0], 400)
        self.assertEqual(self.json("/api/plans", "POST", {"major": "Physics"})[0], 400)

        _, plan = self.json("/api/plans", "POST", {"name": "Bad placements"})
        plan_id = plan["id"]
        self.assertEqual(self.json(f"/api/plans/{plan_id}/items/NOPE", "PUT", {"year": 1, "trimester": 1})[0], 400)
        self.assertEqual(self.json(f"/api/plans/{plan_id}/items/CS101", "PUT", {"year": 9, "trimester": 1})[0], 400)
        self.assertEqual(self.json(f"/api/plans/{plan_id}/items/CS101", "PUT", {"year": "1", "trimester": 1})[0], 400)
        self.assertEqual(self.json(f"/api/plans/{plan_id}", "PATCH", {"major": "Not a subject"})[0], 400)
        self.assertEqual(self.json(f"/api/plans/{plan_id}", "PATCH", {})[0], 400)

        status, headers, _ = self.request("/api/plans")
        self.assertEqual(status, 405)
        self.assertEqual(headers["Allow"], "POST")
        status, headers, _ = self.request("/about", "POST", {})
        self.assertEqual(status, 405)

    def test_project_pages_load_with_content_and_active_navigation(self):
        for path, heading in [
            ("/abstract", "Project abstract"),
            ("/components", "Components and technology stack"),
            ("/sequence", "Sequence diagram"),
        ]:
            with self.subTest(path=path):
                status, headers, body = self.request(path)
                self.assertEqual(status, 200)
                self.assertIn("text/html", headers["Content-Type"])
                html = body.decode()
                self.assertIn(f"<h1>{heading}</h1>", html)
                self.assertIn(f'href="{path}" aria-current="page"', html)
        self.assertEqual(self.request("/asbtract")[2], self.request("/abstract")[2])
        self.assertEqual(self.request("/unknown-page")[0], 404)


if __name__ == "__main__":
    unittest.main()
