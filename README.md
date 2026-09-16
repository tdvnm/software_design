# Tracey

A small degree planner: a **vanilla TypeScript, HTML and Sass** frontend and a
**Python standard-library** backend on **SQLite3**. The browser uses native
modules and DOM events; the server uses `http.server` and `sqlite3` with no
framework. TypeScript and Sass are the only build dependencies.

The planner is at `/`. Project pages are linked from the footer and work
under whichever domain serves the app; all links use paths relative to that domain.
The same homework material is also in [`docs/`](docs/) as Markdown and PDF.

| Page | Path | Contents |
| --- | --- | --- |
| Planner | `/` | Course catalogue and trimester grid |
| Abstract | `/abstract` | HW1's five-sentence abstract and proposal PDF |
| Components | `/components` | Technology stack, frontend modules and HW2 component responsibilities |
| Sequence | `/sequence` | The sequence diagram, its explanation and the full-size SVG |
| About | `/about` | Project background, current scope and homework documents |

`/asbtract` is also supported as an alias for `/abstract`.

## Abstract

Tracey is a degree-planner prototype for Krea students choosing a major,
minor or concentration, built so they can see whether a plan finishes on time
before committing to it. This version is the Homework 2 prototype: a searchable
474-course catalogue and a four-year trimester grid in vanilla TypeScript, HTML
and Sass, served by a small Python server that reads the catalogue from SQLite3.
A student can pick a programme, browse and filter courses, add them to
trimesters, watch credit totals update and open a course's details; the plan
itself still lives in the browser's memory. The server also has routes to
create plans and place courses in them, but the page does not call those yet,
and nothing computes the last feasible trimester to start a programme, checks
prerequisites or offering patterns, or authenticates users — the questions
Homework 1's proposal was written to answer. The rest of Homework 2's design
(ingest pipeline, deadline engine, rule engine and identity) still has to be
built on top of the schema already in place.

## From HW1: why Tracey exists

**Can I still add this major or minor and finish on time?** That is the question
behind [Homework 1](docs/hw1-proposal.md). A credit total alone cannot answer it:
prerequisites have to be taken in order, and a course may only run in one
trimester each year. The proposal uses seven published timetables and a
474-course catalogue to investigate those constraints.

The proposed system would find the last trimester a programme can be started
while still finishing before graduation, then name the course that prevents a
late start. Its intended users are students choosing programmes and faculty
mentors helping them plan. HW1's validation plan is to check the computed dates
with departments and compare them with two past cohorts' registration histories.

The Business Model Canvas treats adoption as the measure of value: students
using plans during registration, fewer rejected forms and less mentor time
spent counting credits. Keeping the catalogue and rules current is an ongoing
maintenance cost.

This frontend implements the catalogue and planning grid that support that
idea. It does not compute declaration deadlines or decide whether a degree plan
is valid. The [full proposal](docs/hw1-proposal.md#one-page-summary) includes
the one-page summary and complete Business Model Canvas.

## Run

You need Node.js (to compile TypeScript and Sass) and Python 3.12 or later (to
run the server). Neither needs anything beyond `npm install`; the server uses
only Python's standard library.

```sh
npm install
npm run db:init      # create data/tracey.sqlite with empty tables
npm run db:import    # load data/courses.csv into it (474 courses)
npm run dev          # compile the frontend and start the server
```

Open **http://127.0.0.1:3000**. The planner fetches its catalogue from the
database, so skipping the import shows "The database has no courses" instead of
a course list. After editing TypeScript or Sass, run `npm run build` in another
terminal and refresh the browser. HTML changes only need a refresh; server
changes need a restart.

```sh
npm run check       # type-check without generating files
npm run build       # compile TypeScript to JS and Sass to CSS
npm start           # python3 server/run.py — serve the compiled files and the API
npm test            # build, then run the frontend tests (node:test) and server tests (unittest)
```

## What works

- Major and minor selectors that label the plan.
- Search and subject filtering across 474 courses, read from SQLite through `GET /api/courses`.
- Course details: title, subject, credits and description.
- Add/remove courses in a four-year trimester table.
- Credit totals and duplicate-course prevention.
- Dedicated Abstract, Components and Sequence pages, plus an About page with the homework documents.
- Server routes to create a plan, place and remove courses in it, and read it back (see [Backend](#backend)).

Plans stay in browser memory and reset on reload; the page does not call the
plan routes yet. The interface intentionally uses
ordinary controls and a basic table. Hints, prerequisite checks and automatic
scheduling are outside this version.

## From HW2: components and responsibilities

[Homework 2](docs/hw2-components.md#3-the-components) separates catalogue
preparation, shared data and interactive planning. Slow timetable ingestion
belongs in a batch job; persistent data belongs in a database; immediate
feedback belongs in the browser. The server provides the API between them.

| HW2 component | Role in the design | What exists here |
| --- | --- | --- |
| Client | Browse courses and arrange a degree plan | Programme selectors, catalogue, trimester table and details panel |
| API | Read catalogue data and save plans | `GET /api/courses` feeds the page; plan create/read/update and course placement routes exist but the page does not call them yet |
| Catalogue store | Keep courses, offerings and requirements | SQLite course/subject tables, filled by the CSV import |
| Plan store | Keep named plans and placements | `plan` and `plan_item` tables, written by the API; the active plan on the page still stays in browser memory |
| Ingest pipeline | Rebuild the catalogue from university sources | Future work; this version uses a CSV snapshot |
| Deadline engine | Calculate the last feasible start and blocking course | Future work |
| Rule engine | Explain prerequisite, offering and credit violations | Future work; only duplicate prevention and credit sums exist |
| Identity | Sign-in, sessions and read-only sharing | Future work |

The full design proposes Svelte and PostgreSQL. This course prototype uses
vanilla TypeScript and SQLite. HW2's proposed shared rule engine and delayed
plan saves are future work.

### Frontend components used here

| Module | Responsibility |
| --- | --- |
| [`programme.ts`](src/components/programme.ts) | Populate major/minor selectors and update the plan label |
| [`catalogue.ts`](src/components/catalogue.ts) | Search/filter courses and handle Details and Add buttons |
| [`board.ts`](src/components/board.ts) | Render twelve trimester cells, course placements and credit totals |
| [`details.ts`](src/components/details.ts) | Display the selected course's information |
| [`main.ts`](src/main.ts) | Load data, connect component callbacks and report loading/errors |
| [`plan.ts`](src/plan.ts) | Create and update the in-memory plan, block duplicates and sum credits |
| [`data/catalogue.ts`](src/data/catalogue.ts) | Fetch the catalogue from `/api/courses`; also the CSV reader the tests use |

Components create ordinary DOM elements and call functions supplied by
`main.ts`. The plan functions have no DOM or network dependencies, so the data
operations can be checked independently of the page.

### Technologies used

| Technology | Use |
| --- | --- |
| HTML | Page structure, labelled forms and the trimester table |
| TypeScript | Types, plan operations and browser event handlers; compiled to native JavaScript modules |
| Sass / CSS | Shared colour tokens, cards, controls and responsive styling |
| Python `http.server` | Serves the pages, compiled assets and the JSON API |
| Python `sqlite3` / SQLite3 | Schema, CSV import and every query behind the API |
| Node.js `node:test`, Python `unittest` | Frontend data checks; server route and API checks |

TypeScript and Sass are the only npm build dependencies and the server needs
nothing outside Python's standard library. There is no frontend framework,
backend framework or ORM in this prototype.

## Sequence: opening the planner and adding a course

This diagram follows the running prototype. The student and browser are shown
separately so local edits are distinct from HTTP requests.

```mermaid
sequenceDiagram
    actor Student
    participant Browser
    participant Server
    participant Database as SQLite

    Student->>Browser: Open the planner
    Browser->>Server: GET / and /assets/ files
    Server-->>Browser: HTML, JavaScript and CSS
    Browser->>Server: GET /api/courses
    Server->>Database: SELECT courses joined with subjects
    Database-->>Server: 474 rows
    Server-->>Browser: Course catalogue as JSON
    Browser-->>Student: Show courses and an empty plan

    Student->>Browser: Select a trimester and click Add
    Browser->>Browser: addCourse checks the current plan
    alt Course is already in the plan
        Browser-->>Student: Show duplicate-course message
    else Course is new to the plan
        Browser->>Browser: Add placement and recalculate credits
        Browser-->>Student: Update the table, totals and status
    end
    Note over Student,Browser: Edits stay in memory; reloading clears the plan

    opt Separate API health check
        Browser->>Server: GET /api/health
        Server->>Database: SELECT 1
        Database-->>Server: OK
        Server-->>Browser: JSON status, database and stage
    end
```

The planner does not call the health endpoint automatically. The
[full sequence diagram](docs/sequence-diagram.md) also covers database setup
and import, with an [SVG version](docs/sequence-diagram.svg) available on the
About page.

## Where the code lives

```text
index.html                Planner markup and component containers
about.html                Project overview and original documents
abstract.html             HW1 abstract (/abstract; /asbtract alias)
components.html           Technology stack and HW2 component map (/components)
sequence.html             Sequence diagram and reading notes (/sequence)
src/
  main.ts                 Startup and component event callbacks
  types.ts                Course, term and plan types
  plan.ts                 Plan operations, independent of the DOM
  components/
    programme.ts          Programme selectors
    catalogue.ts          Search, filters and add buttons
    board.ts              Trimester table and totals
    details.ts            Basic course information
  data/catalogue.ts       Fetch /api/courses (and a CSV reader used by the tests)
  lib/
    csv.ts                CSV parsing, including quoted multiline fields
    dom.ts                Small DOM helpers
  styles/
    _variables.scss       Colours, font and spacing (palette from the original Tracey)
    main.scss             Page, header, cards, table and About page styling
server/                   Python, standard library only
  run.py                  Start the server (PORT, default 3000)
  app.py                  Serve public files and answer every /api/ route
  database.py             Open SQLite, apply the schema, turn foreign keys on
  schema.sql              Tables, keys and references
  init_db.py              Create the database
  import_courses.py       One-time CSV import
data/                     Course CSV and generated SQLite file
docs/
  course-map.md           Class concepts, component flow and future API contract
  sequence-diagram.md     Admin / User / Server / Database sequence diagram (.mmd source, .svg render)
  hw1-proposal.md         HW1: abstract, one-page summary, Business Model Canvas (+ PDF)
  hw2-components.md       HW2: components, interactions and design choices (+ PDF)
tests/
  frontend.test.js        CSV parsing, catalogue and plan operations (node:test)
  test_server.py          Pages, the docs allow-list, and every API route (unittest)
dist/                     Generated JavaScript and CSS; do not edit
```

The Sass takes visual cues from the original Tracey in `kreabot_main/tracey`:
plum text, warm pink surfaces, subtle card and button highlights, and a cool
grey planning grid. The tokens are in `src/styles/_variables.scss`, with the
page and component styles in `src/styles/main.scss`.

## Backend

```sh
npm run db:init      # python3 server/init_db.py
npm run db:import    # python3 server/import_courses.py
npm start            # python3 server/run.py
```

SQLite stores its tables in `data/tracey.sqlite` (ignored by Git). Importing again
leaves existing course data alone; to reload the CSV, delete the file and run both
commands again. Use `TRACEY_DB=/path/to/file.sqlite` to choose a different
database. `PORT=3001 npm start` changes the server port.

### API

Every route is in `server/app.py`. Bodies and replies are JSON.

| Route | Does | SQL |
| --- | --- | --- |
| `GET /api/health` | Confirms the database is open | `SELECT 1` |
| `GET /api/courses` | All courses with their subjects, ordered by code | `SELECT … LEFT JOIN course_subject … GROUP BY` |
| `POST /api/plans` | Create a plan from `{name, major?, minor?}`; replies `201` | `INSERT INTO plan` |
| `GET /api/plans/:id` | A plan and its `items` | `SELECT` on `plan` and `plan_item` |
| `PATCH /api/plans/:id` | Change `name`, `major` or `minor` | `UPDATE plan` |
| `PUT /api/plans/:id/items/:code` | Place a course from `{year, trimester}`; moves it if already placed | `INSERT … ON CONFLICT DO UPDATE` |
| `DELETE /api/plans/:id/items/:code` | Remove a placement; replies `204` | `DELETE FROM plan_item` |

Bad input gets a `400` with a message before any SQL runs (empty name, year
outside 1–4, non-integer trimester, malformed JSON). Referring to a course or
subject that does not exist trips SQLite's foreign-key check, which the server
also reports as a `400`. An unknown plan is a `404`; the wrong method on a known
path is a `405` with an `Allow` header.

The page uses `GET /api/courses` today. The plan routes are tested
(`tests/test_server.py`) but not yet called from the browser, so the active
plan still lives in memory and clears on reload.

### What the server will and will not serve

Only named files: the page routes above, compiled JS and CSS under `/assets/`,
`data/courses.csv`, and the PDFs and images under `/docs/`. The Markdown sources,
the database and the server code are not reachable over HTTP. The server listens
on localhost and there are no accounts.

CSV is a text source file. SQLite is a separate database populated by the import
command; editing the CSV does not automatically update that database.

All queries use Python's built-in
[`sqlite3`](https://docs.python.org/3/library/sqlite3.html) module directly, with
parameterised SQL. There is no ORM or backend framework.

## Project documents

- [How this follows COMP350](docs/course-map.md) connects the code to the
  HTML, JavaScript, file, factoring, REST and data-modelling notes, and lists
  the proposed future API routes.
- [Sequence diagram](docs/sequence-diagram.md): setup, planning and the health
  check with Admin, User, Server and Database as the participants. Rendered as
  `docs/sequence-diagram.svg`; the Mermaid source is `docs/sequence-diagram.mmd`.
- [HW1: the proposal](docs/hw1-proposal.md): the five-sentence abstract, the
  one-page summary and the Business Model Canvas. Also as
  [PDF](docs/hw1-proposal.pdf).
- [HW2: components and interactions](docs/hw2-components.md): the full system
  design, with a note on which components this prototype contains. Also as
  [PDF](docs/hw2-components.pdf).

The homework PDFs and diagram are linked from the website. The Markdown sources
and course map can be read in the repository.

## TODO

**Done**

- Frontend: programme selectors, catalogue search/filter, four-year trimester
  board, course details panel, credit totals and duplicate-course prevention.
- Static pages: Abstract, Components, Sequence and About, plus this README.
- Server (Python, SQLite3): static file serving, schema and CSV import, and
  the course/plan API above with tests.
- Planner reads its catalogue from the database via `GET /api/courses`.

**Needed next**

- [ ] Call the plan routes from the page: create a plan on load, `PUT` on Add,
      `DELETE` on Remove, `GET` on reload
- [ ] Ingest pipeline to rebuild the catalogue from university sources instead
      of a CSV snapshot
- [ ] Deadline engine: last feasible start trimester and the course that blocks it
- [ ] Rule engine: prerequisite, offering and credit-load violations
- [ ] Identity: sign-in, sessions and read-only plan sharing
