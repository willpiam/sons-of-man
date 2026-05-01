# Wiki Schema

This schema defines the operating contract for LLM maintenance of this wiki.

## Source of Truth

- Files under `wiki/raw/` are immutable source material.
- Files under `wiki/pages/` are generated and maintained by the LLM.

## Page Types

- `source-summary`
- `concept`
- `entity`
- `decision`
- `analysis`
- `overview`

## Required Frontmatter

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

## Operations

### Ingest
- Add immutable source to `wiki/raw/`.
- Write or update related pages in `wiki/pages/`.
- Update `wiki/index.md`.
- Append entry to `wiki/log.md`.

### Query
- Start with `wiki/index.md`.
- Read only needed pages.
- Answer with path-based citations.
- Save durable analyses in `wiki/pages/analyses/`.

### Lint
- Check for orphan pages, contradictions, stale claims, and missing summaries.
- Apply fixes and record as `lint` entry in `wiki/log.md`.
