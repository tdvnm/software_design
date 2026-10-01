# Opening Tracey and editing a plan

The [SVG](sequence-diagram.svg) and [Mermaid source](sequence-diagram.mmd) show
the current implementation. The course importer runs before the app is served.
It writes the CSV into SQLite within one transaction.

1. The browser requests the HTML and native JS/CSS assets.
2. `GET /api/courses` queries SQLite and returns JSON.
3. The browser joins reference metadata and restores its locally saved plan.
4. Add, move and remove operations update the plan, credit totals and hints.
5. Each plan edit is serialized to localStorage. Export/import uses JSON files.

There are no plan API calls during these edits. The server's separate plan CRUD
routes are implemented and tested, but not connected to the current interface.
A browser storage error produces a visible message and export remains available.
