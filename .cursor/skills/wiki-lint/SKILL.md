---
name: wiki-lint
description: Run wiki health checks and apply consistency fixes across pages, links, and source coverage, then record lint maintenance in the wiki log. Use when the user asks to audit wiki quality, fix drift, resolve contradictions, or clean up stale documentation.
disable-model-invocation: true
---

# Wiki Lint

## Goal
Continuously maintain wiki consistency, coverage, and navigability.

## Health Checks
Run checks for:
- orphan pages with no inbound links
- duplicated concepts with overlapping definitions
- stale pages not updated after newer source ingests
- contradictions between core concept pages
- missing source summaries for files present in `wiki/raw/`

## Fix Workflow
1. Detect and list issues by category.
2. Apply targeted page fixes:
   - add or correct internal links
   - merge or de-duplicate overlapping concept pages
   - refresh stale pages and update frontmatter `updated`
   - resolve contradictions using canonical terminology
   - create missing source summaries in `wiki/pages/sources/`
3. Update `wiki/index.md` if page set, summaries, or dates changed.
4. Append a `lint` entry to `wiki/log.md` documenting fixes.

## Priority Order
1. Contradictions in core concept pages
2. Missing source summaries
3. Orphan pages
4. Duplicate concept definitions
5. Staleness cleanup

## Log Format
- Header: `## [YYYY-MM-DD] lint | <title>`
- Include:
  - checks performed
  - issues found
  - pages changed
  - unresolved follow-ups (if any)

