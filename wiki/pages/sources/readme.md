---
title: "Source Summary - ReadMe"
type: source-summary
status: in-progress
updated: 2026-05-05
source_refs:
  - ReadMe.md
  - web/package.json
  - server/package.json
tags:
  - sons-of-man
  - source
---

# Source Summary: ReadMe

Primary project summary, links, local run instructions, and oath candidates.

## Extracted commands

- Frontend build (production): from repo root run `cd web && npm run build`.
  - `ReadMe.md` documents the frontend under `web/` and standard npm workflows.
  - `web/package.json` defines `build` as `CI=false craco build` with a pre-copy of `oath.json`.
- API service has no `build` script.
  - `server/package.json` includes `start`, `dev`, and `migrate` only.

## Notes

- If the question is "what is my build command?" for deployable assets, use the frontend command:
  - `cd web && npm run build`
