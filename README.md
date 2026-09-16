# Tracey

A small degree-planner frontend written with **vanilla TypeScript, HTML and Sass**.
It uses native browser modules and DOM events. TypeScript and Sass are the only
build dependencies. Node's built-in HTTP server serves the files.

The planner is at `/`. The **About page** at `/about` carries the two homework
documents the project started from and a sequence diagram of what runs today;
the same material is in [`docs/`](docs/) as Markdown.

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
- An About page with the proposal, the component design and a sequence diagram.

Plans stay in memory and reset on reload. The interface intentionally uses
ordinary controls and a basic table. Hints, prerequisite checks and automatic
scheduling are outside this version.

## Where the code lives

```text
index.html                Planner markup and component containers
about.html                Static About page: proposal, components, sequence diagram
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

The server only serves named files: `/`, `/about`, compiled JS and CSS under
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

All four are linked from the About page at `/about` when the server is running.
