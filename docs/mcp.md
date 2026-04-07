# MCP

This repository now includes an MCP stdio server in:

- `mcp/server.js`

The server is intentionally thin. It wraps the existing shared toolchain instead of becoming a second rule engine.

It is also now secure-by-default for local use:

- scan paths are restricted to configured allowed roots
- if no roots are configured, the default root is the MCP process working directory
- imported Plugin Check reports must also stay within those allowed roots
- ZIP inputs are bounded by size, entry count, extracted size, and extraction timeout limits

---

## Current MCP Tools

### `scan_plugin`

Input:

```json
{
  "path": "/absolute/or/relative/plugin/path-or-zip",
  "plugin_check_json_path": "/absolute/or/relative/plugin-check-report.json",
  "plugin_check_report_path": "/absolute/or/relative/plugin-check-results.txt",
  "plugin_check_auto": true
}
```

Behavior:

- runs the shared scan through the core engine
- returns structured scan output
- accepts either a plugin directory or a ZIP release artifact
- can merge a saved Plugin Check JSON report into the shared findings model
- can merge a raw official Plugin Check CLI results file into the shared findings model
- can auto-discover common `plugin-check-results.*` artifacts

### `render_report`

Input:

```json
{
  "path": "/path/to/plugin-or-zip",
  "plugin_check_json_path": "/path/to/plugin-check-report.json",
  "plugin_check_report_path": "/path/to/plugin-check-results.txt",
  "plugin_check_auto": true
}
```

or

```json
{ "report": { "...": "existing report object" } }
```

Behavior:

- renders markdown from a scan result
- can render from a merged report that includes imported Plugin Check findings

### `list_rules`

Optional filters:

- `category`
- `severity`
- `coverage`

Behavior:

- reads indexed rules from `rules/index.json`

### `get_rule`

Input:

```json
{ "rule_id": "plugin_repo.direct_file_access" }
```

Behavior:

- returns the full rule definition and file metadata

---

## Run Locally

```bash
node mcp/server.js
```

If your MCP client accepts a command-based server config, point it at that command within the repository root.

### Recommended Client Setup

For the smoothest experience, point the MCP server at the plugin workspace you want the agent to scan.

Recommended pattern:

- set the MCP working directory to the plugin or monorepo workspace
- set `WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS` to that same workspace root

Example:

```json
{
  "command": "node",
  "args": ["/Users/Jeewan/Desktop/SANT Projects/wp-plugin-compliance-checker/mcp/server.js"],
  "cwd": "/absolute/path/to/your/plugin-workspace",
  "env": {
    "WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS": "/absolute/path/to/your/plugin-workspace"
  }
}
```

That setup keeps normal usage friction low while still preventing accidental scans of unrelated local directories.

### Security Configuration

By default, the MCP server only allows scan and import paths inside the current working directory.

Optional environment variables:

- `WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS=/abs/path/one,/abs/path/two`
- `WP_PLUGIN_COMPLIANCE_MCP_ALLOW_ANY_PATH=1`

The second option disables the root restriction entirely and should only be used intentionally.

---

## Design Notes

- The MCP server calls the shared core scan and markdown layers directly.
- The MCP server reads project rules directly from `rules/`.
- The Claude skill can now remain a high-level adapter instead of duplicating scan logic.
- This keeps the rule source of truth in one place.
- The MCP server does not expose arbitrary shell execution.
- The main security boundary is local path access, so the path restrictions above matter.

---

## Testing

Run the MCP smoke test:

```bash
bash tests/test-mcp-smoke.sh
```

Or run the full suite:

```bash
./bin/wp-plugin-compliance test
```
