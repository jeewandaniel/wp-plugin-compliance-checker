# CLI

The repository now has a stable command entrypoint in `bin/wp-plugin-compliance`.

The CLI is now backed by the shared engine in `src/cli.js`, so the shell wrappers, CLI, and MCP adapter all consume the same scanning and reporting logic.

---

## Commands

### Scan

Run a rules-driven compliance scan:

```bash
./bin/wp-plugin-compliance scan /path/to/plugin
./bin/wp-plugin-compliance scan /path/to/plugin.zip
./bin/wp-plugin-compliance scan --format=json /path/to/plugin
./bin/wp-plugin-compliance scan --format=json --plugin-check-json plugin-check-report.json /path/to/plugin
./bin/wp-plugin-compliance scan --format=json --plugin-check-report plugin-check-results.txt /path/to/plugin
./bin/wp-plugin-compliance scan --format=json --plugin-check-auto /path/to/plugin
```

This command now runs through the shared core engine and supports:

- a plugin directory
- a ZIP release artifact
- an optional saved Plugin Check JSON report via `--plugin-check-json`
- an optional Plugin Check report path in either JSON or official CLI stream form via `--plugin-check-report`
- auto-discovery of common `plugin-check-results.*` artifacts via `--plugin-check-auto`

### Report

Render a markdown report from JSON scan output:

```bash
./bin/wp-plugin-compliance scan --format=json /path/to/plugin > report.json
./bin/wp-plugin-compliance report report.json
```

You can also pipe JSON directly:

```bash
./bin/wp-plugin-compliance scan --format=json /path/to/plugin | ./bin/wp-plugin-compliance report
```

When a scan report already includes imported Plugin Check findings, the rendered markdown keeps both sources in the same document.

The old `--plugin-check-json` flag remains supported as a narrower compatibility alias for saved JSON reports.

### Test

Run the local regression suites:

```bash
./bin/wp-plugin-compliance test
```

This executes the shell-based suites under `tests/`.
It also includes the direct core-engine regression test.

---

## Legacy Compatibility

The old entrypoint still works:

```bash
./scripts/check-compliance.sh /path/to/plugin
```

It now flows into the same shared core engine, so there is one evolving execution path underneath every surface.
