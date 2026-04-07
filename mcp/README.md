# MCP Server

This directory contains a thin stdio MCP adapter for the WordPress.org Plugin Compliance Checker.

It does not implement separate rule logic.

Instead, it wraps:

- the shared engine under `src/`
- the shared markdown renderer
- rule files under `rules/`

## Available Tools

- `scan_plugin`
- `render_report`
- `list_rules`
- `get_rule`

The scan and report tools can also merge saved Plugin Check JSON reports or official CLI result files.

## Run Locally

```bash
node mcp/server.js
```

The server communicates over stdio using the MCP JSON-RPC transport.

## Recommended Configuration

For normal use, launch the server with the MCP client working directory set to the plugin workspace and mirror that path in `WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS`.

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

That gives agents a clear workspace boundary without making normal scans awkward.
