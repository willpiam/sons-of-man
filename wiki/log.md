# Wiki Log

## [2026-05-01] refactor | Initialize wiki scaffold

- Created folder structure under `wiki/`:
  - `raw/docs`, `raw/links`, `raw/media`
  - `pages/overview`, `pages/sources`, `pages/concepts`
  - `pages/entities`, `pages/decisions`, `pages/analyses`
  - `scratch`
- Added `wiki/index.md`.
- Added `wiki/schema.md`.

## [2026-05-01] ingest | Bootstrap initial source set

- Planned initial source ingest set:
  - `ReadMe.md`
  - `covanant.md`
  - `The Covanant of the Sons of Man.pdf`
- Pending: generate source summaries and linked concept/entity pages.

## [2026-05-05] query | Build command lookup

- question topic: determine the project's build command from wiki content.
- pages consulted:
  - `wiki/index.md`
  - `wiki/pages/sources/readme.md`
  - `wiki/pages/overview/project-overview.md`
- analysis page path: `wiki/pages/analyses/build-command-status.md`

## [2026-05-05] query | Build command confirmed from codebase

- question topic: identify and persist the actual build command.
- pages consulted:
  - `ReadMe.md`
  - `web/package.json`
  - `server/package.json`
  - `wiki/pages/sources/readme.md`
  - `wiki/pages/analyses/build-command-status.md`
- analysis page path: `wiki/pages/analyses/build-command-status.md`
