# Integrations

This project is being structured so the same rule layer can support multiple usage surfaces.

The current CLI, shell wrappers, report renderer, and MCP adapter all sit on top of the shared core under `src/`.

---

## Current Integration Paths

### Shell

- `scripts/check-rules.sh`
- `scripts/check-compliance.sh`

### Stable CLI Entry Point

- `bin/wp-plugin-compliance`

### Claude Skill

- `skills/wp-plugin-check/SKILL.md`

### CI-Friendly JSON

- `scripts/check-rules.sh --format=json`
- `bin/wp-plugin-compliance scan --format=json`
- `bin/wp-plugin-compliance scan --format=json --plugin-check-json plugin-check-report.json`
- `bin/wp-plugin-compliance scan --format=json --plugin-check-report plugin-check-results.txt`
- `bin/wp-plugin-compliance scan --format=json --plugin-check-auto`

### MCP

- `mcp/server.js`

The MCP server exposes:

- `scan_plugin`
- `render_report`
- `list_rules`
- `get_rule`

---

## GitHub Actions

This repo now includes a basic workflow example in:

- `.github/workflows/validate-tooling.yml`

That workflow validates the rule files and runs the local regression suites on pushes and pull requests.

For consumer repositories, the typical pattern is:

1. build the plugin artifact or release directory
2. run this tool in JSON mode
3. optionally merge a saved Plugin Check report or raw `plugin-check-results.txt` artifact into the same output
4. render or publish a markdown report
5. also run the official WordPress Plugin Check workflow where available

---

## Next Integration Targets

Planned next-tier integrations include:

- a richer CLI release artifact workflow
- markdown and PR-comment publishing helpers
- broader normalization and direct execution paths for official `wp plugin check` output
- editor-specific client examples beyond the base MCP server
