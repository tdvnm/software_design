import json
import re
import sqlite3
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "dist"
DOCS = ROOT / "docs"
MIME = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".csv": "text/csv",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".png": "image/png",
}
PAGES = {
    "/": "index.html",
    "/about": "about.html",
    "/abstract": "abstract.html",
    "/asbtract": "abstract.html",
    "/components": "components.html",
    "/sequence": "sequence.html",
    "/data/courses.csv": "data/courses.csv",
}
PLAN_ROUTE = re.compile(r"^/api/plans/([1-9]\d*)$")
ITEM_ROUTE = re.compile(r"^/api/plans/([1-9]\d*)/items/([^/]+)$")


class HttpError(Exception):
    def __init__(self, status, message, headers=None):
        super().__init__(message)
        self.status = status
        self.headers = headers or {}


def create_server(db, host="127.0.0.1", port=3000):
    class Handler(RequestHandler):
        database = db

    return HTTPServer((host, port), Handler)


class RequestHandler(BaseHTTPRequestHandler):
    database = None

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        self.dispatch()

    def do_HEAD(self):
        self.dispatch()

    def do_POST(self):
        self.dispatch()

    def do_PUT(self):
        self.dispatch()

    def do_PATCH(self):
        self.dispatch()

    def do_DELETE(self):
        self.dispatch()

    def dispatch(self):
        try:
            path = unquote(urlsplit(self.path).path)
            if path.startswith("/api/"):
                self.handle_api(path)
            else:
                self.handle_file(path)
        except HttpError as error:
            self.send_json(error.status, {"error": str(error)}, error.headers)
        except Exception as error:  # noqa: BLE001 - last line of defence, never crash the server
            print(f"Request failed: {error!r}")
            self.send_json(500, {"error": "Request failed."})

    # ------------------------------------------------------------------ files

    def handle_file(self, path):
        if self.command not in ("GET", "HEAD"):
            return self.send_json(405, {"error": "Method not allowed."}, {"Allow": "GET, HEAD"})
        if path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return None

        file = None
        if path in PAGES:
            file = ROOT / PAGES[path]
        elif path.startswith("/assets/"):
            file = safe_child(ASSETS, path[len("/assets/"):], (".js", ".css"))
        elif path.startswith("/docs/"):
            # Only the images and PDFs linked from the About page, never the Markdown sources.
            file = safe_child(DOCS, path[len("/docs/"):], (".svg", ".pdf", ".png"))
        if file is None:
            return self.send_json(404, {"error": "Not found."})

        try:
            content = file.read_bytes()
        except FileNotFoundError:
            return self.send_json(404, {"error": "File missing. Run npm run build first."})
        self.send_response(200)
        self.send_header("Content-Type", f"{MIME[file.suffix]}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)
        return None

    # -------------------------------------------------------------------- api

    def handle_api(self, path):
        db = self.database

        if path == "/api/health":
            self.require_method("GET", "HEAD")
            db.execute("SELECT 1").fetchone()
            return self.send_json(200, {"status": "ok", "database": "sqlite", "stage": "setup"})

        if path == "/api/courses":
            self.require_method("GET", "HEAD")
            return self.send_json(200, list_courses(db))

        if path == "/api/plans":
            self.require_method("POST")
            body = self.read_json_body()
            name = require_string(body.get("name"), "name", 1, 80)
            major = require_optional_string(body.get("major"), "major")
            minor = require_optional_string(body.get("minor"), "minor")
            cursor = run(db, "INSERT INTO plan (name, major, minor) VALUES (?, ?, ?)", (name, major, minor))
            return self.send_json(201, get_plan(db, cursor.lastrowid))

        item = ITEM_ROUTE.match(path)
        if item:
            plan_id, course_code = int(item.group(1)), item.group(2)
            self.require_method("PUT", "DELETE")
            if get_plan(db, plan_id) is None:
                return self.send_json(404, {"error": "Plan not found."})
            if self.command == "DELETE":
                db.execute("DELETE FROM plan_item WHERE plan_id = ? AND course_code = ?", (plan_id, course_code))
                self.send_response(204)
                self.end_headers()
                return None
            body = self.read_json_body()
            year = require_int(body.get("year"), "year", 1, 4)
            trimester = require_int(body.get("trimester"), "trimester", 1, 3)
            run(
                db,
                """INSERT INTO plan_item (plan_id, course_code, year, trimester) VALUES (?, ?, ?, ?)
                   ON CONFLICT(plan_id, course_code) DO UPDATE SET year = excluded.year, trimester = excluded.trimester""",
                (plan_id, course_code, year, trimester),
            )
            return self.send_json(200, get_plan(db, plan_id))

        plan = PLAN_ROUTE.match(path)
        if plan:
            plan_id = int(plan.group(1))
            self.require_method("GET", "HEAD", "PATCH")
            if self.command == "PATCH":
                body = self.read_json_body()
                fields, values = [], []
                if "name" in body:
                    fields.append("name = ?")
                    values.append(require_string(body["name"], "name", 1, 80))
                if "major" in body:
                    fields.append("major = ?")
                    values.append(require_optional_string(body["major"], "major"))
                if "minor" in body:
                    fields.append("minor = ?")
                    values.append(require_optional_string(body["minor"], "minor"))
                if not fields:
                    raise HttpError(400, "Nothing to update.")
                fields.append("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
                cursor = run(db, f"UPDATE plan SET {', '.join(fields)} WHERE id = ?", (*values, plan_id))
                if cursor.rowcount == 0:
                    return self.send_json(404, {"error": "Plan not found."})
                return self.send_json(200, get_plan(db, plan_id))
            found = get_plan(db, plan_id)
            if found is None:
                return self.send_json(404, {"error": "Plan not found."})
            return self.send_json(200, found)

        return self.send_json(404, {"error": "Not found."})

    # ---------------------------------------------------------------- helpers

    def require_method(self, *allowed):
        if self.command not in allowed:
            raise HttpError(405, "Method not allowed.", {"Allow": ", ".join(allowed)})

    def read_json_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length == 0:
            return {}
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            raise HttpError(400, "Invalid JSON body.") from None
        if not isinstance(body, dict):
            raise HttpError(400, "JSON body must be an object.")
        return body

    def send_json(self, status, body, headers=None):
        content = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)


def safe_child(base, relative, suffixes):
    candidate = (base / relative).resolve()
    if base not in candidate.parents or candidate.suffix not in suffixes:
        return None
    return candidate


def list_courses(db):
    rows = db.execute(
        """SELECT c.code, c.title, c.credits, c.description,
                  COALESCE(GROUP_CONCAT(cs.subject_name), '') AS subjects
           FROM course c
           LEFT JOIN course_subject cs ON cs.course_code = c.code
           GROUP BY c.code
           ORDER BY c.code"""
    ).fetchall()
    return [
        {
            "code": row["code"],
            "title": row["title"],
            "credits": row["credits"],
            "description": row["description"],
            "subjects": row["subjects"].split(",") if row["subjects"] else [],
        }
        for row in rows
    ]


def get_plan(db, plan_id):
    plan = db.execute("SELECT id, name, major, minor, updated_at FROM plan WHERE id = ?", (plan_id,)).fetchone()
    if plan is None:
        return None
    items = db.execute(
        "SELECT course_code, year, trimester FROM plan_item WHERE plan_id = ? ORDER BY year, trimester, course_code",
        (plan_id,),
    ).fetchall()
    return {**dict(plan), "items": [dict(item) for item in items]}


def run(db, sql, params):
    """A write whose constraint failure (unknown course, bad subject, out-of-range
    year) becomes a 400 for the client instead of a 500."""
    try:
        return db.execute(sql, params)
    except sqlite3.IntegrityError as error:
        raise HttpError(400, f"Invalid data: {error}") from None


def require_string(value, field, minimum, maximum):
    if not isinstance(value, str) or not minimum <= len(value) <= maximum:
        raise HttpError(400, f'"{field}" must be a string between {minimum} and {maximum} characters.')
    return value


def require_optional_string(value, field):
    if value is None:
        return None
    return require_string(value, field, 1, 200)


def require_int(value, field, minimum, maximum):
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise HttpError(400, f'"{field}" must be an integer between {minimum} and {maximum}.')
    return value
