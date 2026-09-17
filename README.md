# tracey

A degree planner for Krea, built with **HTML, CSS and plain JavaScript**.
The four-panel layout, palette and catalogue data come from my original
[Tracey](https://github.com/tdvnm/tracey). This version uses native DOM events
and browser modules, with a **Python standard-library server and SQLite**.
There are no frontend frameworks, npm dependencies, transpilers or CSS preprocessors.

## Run

Use Python 3.12+. Node.js 22.13+ is needed only to run the frontend tests.

```sh
npm run db:import   # creates the database and imports all 474 courses
npm run dev         # copies src to dist, then serves http://127.0.0.1:3000
```

`npm install` is not needed. `npm run build` only copies source files into
`dist/`; it does not compile or bundle anything. After editing JavaScript or
CSS, rebuild and refresh. HTML edits need only a refresh.

```sh
npm test           # frontend behaviour and Python API/database tests
npm run build
npm start          # serve an existing build
```

`PORT=3001 npm start` changes the port. `TRACEY_DB=/path/to/file.sqlite`
selects a different database. The app listens on localhost.

## Using the planner

- Pick a three- or four-year programme, with a major, double major, minor or concentration.
- Search by title or code, filter by subject, and inspect course details and prerequisites.
- Add courses with a button, drag them between trimesters, or move them from the details panel.
- Start with the twelve foundation courses, or build a plan from scratch.
- Open an individual trimester; its cards use widths proportional to credits.
- Show codes, titles or both. Switch between light and dark themes.
- See credit-load, prerequisite, eligibility and historical-offering hints.
- Plans and preferences save in this browser. Export/import JSON to carry a plan elsewhere.
- Undo the last plan edit, including clearing or importing a plan.

The interface remains usable on smaller screens, and drag actions have button
alternatives. The quick tour explains the controls.

## What the hints mean

The course metadata and programme lists are snapshots from `tdvnm/tracey`
commit `b343267`. `src/data/metadata.js` contains only the fields needed here;
`src/data/programmes.js` uses the current course codes from `requirements.json`,
not the legacy programme code list. The catalogue itself still comes from
SQLite through `GET /api/courses`.

Requirement progress counts the **listed fixed courses**, not a degree audit.
Choice pools, substitutions, waived requirements, grades, audits and declaration
deadlines are not implemented here. A programme with no published fixed list
is labelled as such. Historical offerings are hints, not a promise that a course
will run in a future term. Confirm the full programme with a mentor.

Local saving does not call the server's plan API. Clearing browser storage clears
that saved copy; export a file for a backup. Corrupt saves are not silently
overwritten, and a storage error is shown in the planner.

## Code map

| File | Responsibility |
| --- | --- |
| `index.html` | Planner structure, controls and help dialog |
| `src/main.js` | Connect DOM events, plan state and rendering |
| `src/plan.js` | Add, remove, move, credit totals and foundation starter |
| `src/storage.js` | Validate, save and restore versioned JSON plans |
| `src/rules.js` | Planning hints and fixed-requirement progress |
| `src/components/` | Programme controls, catalogue, grid, zoom, details and hints |
| `src/lib/` | Small DOM, CSV and drag/drop functions |
| `src/data/` | API catalogue loader and reference metadata |
| `src/styles/main.css` | Layout, colour variables, themes and responsive rules |
| `server/` | HTTP routing, SQL schema and transactional CSV import |
| `scripts/` | Copy build |
| `tests/` | Native Node.js and Python tests |

The course-topic mapping is in [docs/course-map.md](docs/course-map.md), based on
[COMP350](https://kreauniv.github.io/comp350/index.html).

## HTTP API

All request/response bodies are JSON. SQL values use bound parameters.

| Method and route | Behaviour |
| --- | --- |
| `GET /api/health` | Check SQLite connectivity |
| `GET /api/courses` | Read courses joined with their subjects |
| `POST /api/plans` | Create `{name, major?, minor?}` |
| `GET /api/plans/:id` | Read a saved server plan and placements |
| `PATCH /api/plans/:id` | Update the name, major or minor |
| `PUT /api/plans/:id/items/:code` | Add/move a course with `{year, trimester}` |
| `DELETE /api/plans/:id/items/:code` | Remove a course placement |

The plan endpoints are implemented and tested; the current UI uses browser
storage for its active plan. No accounts or shared server plans are exposed in
the UI. Only the named page routes, `/assets/` JS/CSS, the course CSV and
`/docs/` images/PDFs are publicly served. Database files, logs and server source
are not served.

## Project pages and documents

`/about`, `/abstract`, `/components` and `/sequence` explain the project.
`/asbtract` remains an alias for `/abstract`.

- [HW1 proposal](docs/hw1-proposal.md) and [PDF](docs/hw1-proposal.pdf)
- [HW2 design](docs/hw2-components.md) and [PDF](docs/hw2-components.pdf)
- [Current sequence](docs/sequence-diagram.md), [Mermaid source](docs/sequence-diagram.mmd) and [SVG](docs/sequence-diagram.svg)

The homework proposals describe the original intended system. The current
implementation and its limits are documented above.
