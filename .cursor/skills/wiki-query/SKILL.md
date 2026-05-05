---
name: wiki-query
description: Answer repository questions from wiki pages with path-based citations, and persist durable insights as analysis pages with index/log updates. Use when the user asks questions about project concepts, decisions, entities, sources, or historical rationale.
disable-model-invocation: true
---

# Wiki Query

## Goal
Answer questions using existing wiki knowledge first, then persist high-value conclusions back into the wiki.

## Query Process
1. Read `wiki/index.md` before reading any page content.
2. Select only the most relevant pages for the question.
3. Answer with explicit path-based citations to wiki pages.
4. If the answer creates durable insight, save it in `wiki/pages/analyses/` with required frontmatter.
5. If a new analysis page is created or updated:
   - update `wiki/index.md`
   - append `wiki/log.md` entry with `query` operation

## Citation Rules
- Use direct wiki file paths for every key claim.
- Prefer canonical concept/entity/decision pages over secondary summaries.
- If sources conflict, call out uncertainty explicitly and cite both pages.

## Durable Insight Criteria
Persist the response under `wiki/pages/analyses/` when at least one is true:
- The answer synthesizes multiple pages into a reusable conclusion.
- The answer resolves an ambiguity likely to recur.
- The answer captures a stable design rationale or tradeoff.

## Log Format
- Header: `## [YYYY-MM-DD] query | <title>`
- Include:
  - question topic
  - pages consulted
  - analysis page path (if created)

