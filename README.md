# Tracey

A small degree-planner frontend written with **vanilla TypeScript, HTML and Sass**.
It uses native browser modules and DOM events. TypeScript and Sass are the only
build dependencies. Node's built-in HTTP server serves the files.

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
before committing to it. This version is the Homework 2 frontend: a searchable
474-course catalogue and a four-year trimester grid, written in vanilla
TypeScript, HTML and Sass and served by a small Node.js server. A student can
pick a programme, browse and filter courses, add them to trimesters, watch
credit totals update and open a course's details, all working in the browser's
memory. It does not yet compute the last feasible trimester to start a
programme, check prerequisites or offering patterns, save plans, or
authenticate users — the questions Homework 1's proposal was written to
answer. The rest of Homework 2's design (ingest pipeline, deadline engine,
rule engine, plan persistence and identity) still has to be built on top of
the SQLite schema already in place.

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

Use Node.js 22.13 or later.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:3000**. `dev` compiles the files and starts the server.
After editing TypeScript or Sass, run `npm run build` in another terminal and
refresh the browser. HTML changes only need a refresh.

```sh
npm run check       # type-check without generating files
npm run build       # compile TypeScript to JS and Sass to CSS
npm start           # serve the compiled files
npm test            # compile, then check CSV handling, plan operations and the server routes
```

## What works

- Major and minor selectors that label the plan.
- Search and subject filtering across 474 courses from the original Tracey catalogue.
- Course details: title, subject, credits and description.
- Add/remove courses in a four-year trimester table.
- Credit totals and duplicate-course prevention.
- Dedicated Abstract, Components and Sequence pages, plus an About page with the homework documents.

Plans stay in memory and reset on reload. The interface intentionally uses
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
| API | Read catalogue data and save plans | Only `GET /api/health`; the browser fetches the CSV directly |
| Catalogue store | Keep courses, offerings and requirements | SQLite course/subject tables and an optional CSV import |
| Plan store | Keep named plans and placements | Schema only; the active plan stays in browser memory |
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
| [`data/catalogue.ts`](src/data/catalogue.ts) and [`csv.ts`](src/lib/csv.ts) | Fetch the catalogue and parse the CSV |

Components create ordinary DOM elements and call functions supplied by
`main.ts`. The plan functions have no DOM or network dependencies, so the data
operations can be checked independently of the page.

### Technologies used

| Technology | Use |
| --- | --- |
| HTML | Page structure, labelled forms and the trimester table |
| TypeScript | Types, plan operations and browser event handlers; compiled to native JavaScript modules |
| Sass / CSS | Shared colour tokens, cards, controls and responsive styling |
| Node.js `node:http` | Local file server and API health route |
| Node.js `node:sqlite` / SQLite | Database schema and optional catalogue import |
| Node.js `node:test` | Frontend data and server route checks |

TypeScript and Sass are the only npm build dependencies. There is no frontend
framework, backend framework or ORM in this prototype.

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
    Browser->>Server: GET /data/courses.csv
    Server-->>Browser: Course catalogue
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
  data/catalogue.ts       Download and read the CSV
  lib/
    csv.ts                CSV parsing, including quoted multiline fields
    dom.ts                Small DOM helpers
  styles/
    _variables.scss       Colours, font and spacing (palette from the original Tracey)
    main.scss             Page, header, cards, table and About page styling
server/
  index.js                Start the local server
  app.js                  Serve public files, the About page and the API health check
  database.js             Open SQLite and apply the schema
  schema.sql              Tables, keys and references
  init.js                 Create the database
  import.js               One-time CSV import
data/                     Course CSV and generated SQLite file
docs/
  course-map.md           Class concepts, component flow and future API contract
  sequence-diagram.md     Admin / User / Server / Database sequence diagram (.mmd source, .svg render)
  hw1-proposal.md         HW1: abstract, one-page summary, Business Model Canvas (+ PDF)
  hw2-components.md       HW2: components, interactions and design choices (+ PDF)
tests/
  frontend.test.js        CSV parsing, catalogue and plan operations
  server.test.js          Routes, the docs allow-list and the health check
dist/                     Generated JavaScript and CSS; do not edit
```

The Sass takes visual cues from the original Tracey in `kreabot_main/tracey`:
plum text, warm pink surfaces, subtle card and button highlights, and a cool
grey planning grid. The tokens are in `src/styles/_variables.scss`, with the
page and component styles in `src/styles/main.scss`.

## Backend: setup only

```sh
npm run db:init
npm run db:import
```

SQLite stores its tables in `data/tracey.sqlite` (ignored by Git). Importing again
leaves existing course data alone. Use `TRACEY_DB=/path/to/file.sqlite` to choose
a different database. `PORT=3001 npm start` changes the server port.

The server responds to `GET /api/health`. Course and plan REST endpoints are
**not implemented or connected to the frontend yet**. The browser currently
reads the CSV; it neither saves plans nor reads SQLite. The server listens on
localhost and this setup has no accounts.

The server only serves named files: the page routes above, compiled JS and CSS under
`/assets/`, `data/courses.csv`, and the PDFs and images under `/docs/`. The
Markdown sources, the database and the server code are not reachable over HTTP.

CSV is a text source file. SQLite is a separate database populated by the optional
import command; editing the CSV does not automatically update that database.

The backend uses [Node's built-in SQLite module](https://nodejs.org/api/sqlite.html),
with direct SQL and parameterised queries. There is no ORM or backend framework.

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
- Server: static file serving, SQLite schema and optional CSV import,
  `GET /api/health`.

**Needed next**

- [ ] Course/Plan REST API connected to the frontend (it currently reads the
      CSV directly and never saves a plan)
- [ ] Ingest pipeline to rebuild the catalogue from university sources instead
      of a CSV snapshot
- [ ] Deadline engine: last feasible start trimester and the course that blocks it
- [ ] Rule engine: prerequisite, offering and credit-load violations
- [ ] Plan persistence across reloads (plans are in-memory only right now)
- [ ] Identity: sign-in, sessions and read-only plan sharing
