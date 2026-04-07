# Core Engine

This directory now contains the shared engine that powers the current CLI, shell wrappers, and MCP adapter.

The current implementation is Node-based so the repository can ship a reusable core immediately in this environment. A PHP-native distribution can still be added later if WordPress-first packaging becomes the priority.

---

## Responsibilities

The current core engine is responsible for:

- load structured rules from `rules/`
- inspect plugin directories and ZIP release artifacts
- emit a canonical findings model
- render human and markdown output through shared formatters
- provide one reusable implementation boundary for CLI and MCP usage

---

## Current Modules

- `rules.js` for loading indexed rule definitions
- `engine.js` for scanning directories and ZIP archives
- `report.js` for human and markdown rendering
- `cli.js` for the shared command entrypoint

---

## Next Engine Milestones

1. Add richer rule validation against `rules/schema.json`
2. Expand file-aware checks beyond line-based heuristics
3. Support upstream `wp plugin check` result ingestion and merge
4. Add more explicit artifact metadata to the JSON report
5. Decide whether to add a PHP-native packaging layer

The goal remains the same: adapters should consume the same engine instead of becoming separate logic owners.
