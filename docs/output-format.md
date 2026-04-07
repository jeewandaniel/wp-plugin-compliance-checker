# Output Format

The shared engine can emit machine-readable JSON through the CLI or shell-compatible runner:

```bash
./bin/wp-plugin-compliance scan --format=json /path/to/plugin
./bin/wp-plugin-compliance scan --format=json --plugin-check-json plugin-check-report.json /path/to/plugin
./bin/wp-plugin-compliance scan --format=json --plugin-check-report plugin-check-results.txt /path/to/plugin
./bin/wp-plugin-compliance scan --format=json --plugin-check-auto /path/to/plugin
./scripts/check-rules.sh --format=json /path/to/plugin
```

---

## Report Shape

Top-level fields:

- `tool`
- `runner`
- `format_version`
- `plugin_dir`
- `rules_index`
- `generated_at`
- `verdict`
- `summary`
- `findings`
- `sources`
- `imports`

The current JSON schema is defined in [findings-report.schema.json](../schemas/findings-report.schema.json).

The `runner` field reflects the surface that produced the report, such as `wp-plugin-compliance`, `check-rules.sh`, or `mcp.scan_plugin`.

The `imports` array records imported external result sets. Each entry currently includes:

- `type`
- `format`
- `path`
- `findings`

---

## Summary Object

The `summary` object contains:

- `errors`
- `warnings`
- `advisories`
- `info`
- `executed_rules`
- `skipped_rules`

These counts let CI or higher-level tools make decisions without re-parsing text output.

The `sources` object breaks totals out by:

- `project`
- `plugin_check`

---

## Findings Array

Each finding currently includes:

- `severity`
- `source`
- `origin`
- `rule_id`
- `title`
- `summary`
- `fix`
- `evidence`
- `evidence_lines`
- `locations`

This shape is intentionally simple so other adapters can consume it without needing to understand terminal formatting.

---

## Stability Notes

The JSON format is now structured and test-covered, but it should still be treated as an early project interface.

The shared report model now supports imported Plugin Check findings from:

- saved JSON reports
- raw official `wp plugin check --format=json` CLI stream files such as `plugin-check-results.txt`
- auto-discovered `plugin-check-results.*` artifacts in common action-style locations

The importer is intentionally tolerant because upstream output shapes can vary by workflow.

Near-term likely changes:

- richer file and line modeling
- source URL expansion per finding
- broader normalization for upstream Plugin Check exports
- direct execution or auto-discovery of official Plugin Check output
