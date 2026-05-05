---
name: wiki-ingest
description: Execute the wiki ingest workflow end-to-end for new or updated sources in wiki/raw, including source summaries, cross-link updates, and required index/log maintenance. Use when the user asks to ingest documents, add wiki knowledge, or sync pages with new source material.
disable-model-invocation: true
---

# Wiki Ingest

## Goal
Turn immutable source material in `wiki/raw/` into updated, linked knowledge pages in `wiki/pages/`, then record the work in `wiki/index.md` and `wiki/log.md`.

## Rules
- Treat all files under `wiki/raw/` as immutable after ingest.
- Use kebab-case filenames for generated pages.
- Ensure every generated page has required frontmatter (`title`, `type`, `status`, `updated`, `source_refs`, `tags`).
- Add at least 2 internal links on every non-trivial page.
- Prefer linking to canonical concept/entity pages instead of repeating definitions.

## Workflow
1. Identify new or changed source files under `wiki/raw/`.
2. Create or update matching summaries under `wiki/pages/sources/`.
3. Update impacted pages in:
   - `wiki/pages/concepts/`
   - `wiki/pages/entities/`
   - `wiki/pages/decisions/`
   - `wiki/pages/overview/`
4. Add cross-links between related pages.
5. Update `wiki/index.md`:
   - keep pages grouped by type
   - one line per page with link, one-sentence summary, and last update date
6. Append to `wiki/log.md` using:
   - `## [YYYY-MM-DD] ingest | <title>`
   - include changed pages and short rationale

## Definition Of Done
- Source summary exists or is updated in `wiki/pages/sources/`.
- Cross-links reflect new information.
- `wiki/index.md` updated.
- `wiki/log.md` has an append-only ingest entry listing changed pages.

