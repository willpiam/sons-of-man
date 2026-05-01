# LLM Wiki Setup (Sons of Man)

This file configures how an LLM should maintain a persistent wiki for this repository.

The goal is to build a compounding knowledge base for:
- the oath text and candidate variants
- project goals and design choices
- chain integration details (Ethereum and Cardano)
- implementation decisions in the codebase

## Quick Start

1. Create the wiki directory structure shown below.
2. Keep all immutable source documents under `wiki/raw/`.
3. Keep all generated knowledge pages under `wiki/pages/`.
4. Update `wiki/index.md` and `wiki/log.md` every time work is done.
5. Use the workflows in this file for ingest, query, and lint passes.

## Directory Layout

```text
wiki/
  raw/
    docs/
    links/
    media/
  pages/
    overview/
    sources/
    concepts/
    entities/
    decisions/
    analyses/
  scratch/
  index.md
  log.md
  schema.md
```

Notes:
- `wiki/raw/` is read-only input material.
- `wiki/pages/` is LLM-maintained output.
- `wiki/scratch/` is optional temporary workspace for in-progress analysis.

## Page Conventions

### Naming
- Use kebab-case for filenames.
- Prefer short, stable names: `sources/readme.md`, `concepts/sovereignty.md`.

### Frontmatter
Use this frontmatter for every generated page:

```yaml
---
title: "Page Title"
type: source-summary | concept | entity | decision | analysis | overview
status: draft | active | superseded
updated: YYYY-MM-DD
source_refs:
  - wiki/raw/docs/...
tags:
  - sons-of-man
---
```

### Linking
- Add at least 2 internal links on every non-trivial page.
- Prefer direct links to canonical concept/entity pages over duplicate explanations.

## Required Core Pages

- `wiki/pages/overview/project-overview.md`
- `wiki/pages/overview/oath-overview.md`
- `wiki/pages/concepts/mutual-flourishing.md`
- `wiki/pages/concepts/sovereignty.md`
- `wiki/pages/concepts/autonomy.md`
- `wiki/pages/entities/sons-of-man-alliance.md`
- `wiki/pages/sources/readme.md` (summary of `ReadMe.md`)
- `wiki/pages/sources/covenant.md` (summary of covenant files)
- `wiki/pages/decisions/oath-wording-history.md`

## Index and Log Rules

### `wiki/index.md`
- Organized by page type.
- One line per page:
  - page link
  - one-sentence summary
  - last update date

### `wiki/log.md`
- Append-only.
- Every entry starts with:

```text
## [YYYY-MM-DD] <operation> | <title>
```

Where `<operation>` is one of:
- `ingest`
- `query`
- `lint`
- `refactor`

## Workflow: Ingest

When adding a new source:
1. Save source in `wiki/raw/` (never edit it afterward).
2. Create or update a page under `wiki/pages/sources/`.
3. Update impacted concept/entity/decision pages.
4. Add links between new and existing pages.
5. Update `wiki/index.md`.
6. Append an ingest entry to `wiki/log.md` listing changed pages.

Definition of done:
- source summary exists
- cross-links are updated
- index and log are updated

## Workflow: Query

When answering a question:
1. Read `wiki/index.md` first.
2. Read only the most relevant pages.
3. Answer with explicit page citations (path-based).
4. If the answer produces durable insight, save it under `wiki/pages/analyses/`.
5. Update index and log.

## Workflow: Lint

Run periodically and check for:
- orphan pages (no inbound links)
- duplicated concepts with overlapping definitions
- stale pages not updated after newer source ingests
- contradictions between core concept pages
- missing source summaries for files that exist in `wiki/raw/`

When issues are found:
1. Fix pages.
2. Record fixes in `wiki/log.md` as a `lint` entry.

## Bootstrap Tasks (Run Once)

1. Create the full `wiki/` structure.
2. Add initial raw sources:
   - `ReadMe.md`
   - `covanant.md`
   - `The Covanant of the Sons of Man.pdf` (or extracted markdown notes)
   - any key external links from the README
3. Generate the required core pages.
4. Initialize `wiki/index.md` and `wiki/log.md`.
5. Create `wiki/schema.md` with any future project-specific refinements.

## Suggested Cursor Skills

Create these skills to operationalize the workflows:
- `/wiki-ingest` - executes the ingest workflow end-to-end.
- `/wiki-query` - answers from wiki pages and files durable outputs.
- `/wiki-lint` - runs health checks and applies consistency fixes.

These can be created with the `/create-skill` workflow.