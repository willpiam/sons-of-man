---
title: "Analysis - Build Command Status"
type: analysis
status: draft
updated: 2026-05-05
source_refs:
  - ReadMe.md
  - web/package.json
  - server/package.json
  - wiki/pages/sources/readme.md
tags:
  - build
  - commands
  - docs-gap
---

# Build Command Status

The project build command for production artifacts is:

- `cd web && npm run build`

Evidence:
- `web/package.json` defines a `build` script:
  - `node -e "require('fs').copyFileSync('../oath.json','public/oath.json')"` then `CI=false craco build`.
- `server/package.json` has no `build` script, only `start`, `dev`, and `migrate`.
- `ReadMe.md` indicates the GUI/frontend lives in `web/`, matching where the build script is defined.

Conclusion:
- For "my build command", use `cd web && npm run build`.
