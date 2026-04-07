# WordPress.org Plugin Compliance Checker

WordPress.org submission guidance, preflight checks, merged Plugin Check reporting, and MCP tooling for plugin developers and AI coding assistants.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What This Is

This project helps WordPress plugin developers catch common WordPress.org submission problems before review, understand what the official rules actually mean, and turn that guidance into a workflow that works in:

- a local CLI
- an MCP client such as Claude Code or Codex
- shell scripts and CI
- markdown reports for teams and clients

It is designed to complement the official WordPress Plugin Check ecosystem, not replace it.

## What You Can Do Today

This repository is already usable as a real toolchain.

- Scan a plugin directory before submission.
- Scan a release ZIP instead of only the source repo.
- Generate human-readable or JSON results.
- Merge your own findings with saved official Plugin Check output.
- Import raw `wp plugin check --format=json` CLI result files such as `plugin-check-results.txt`.
- Auto-discover common `plugin-check-results.*` artifacts in action-style workflows.
- Expose the same behavior through a real MCP server.
- Render a markdown compliance report for a teammate, client, or PR workflow.

## Trust, Scope, and Sources

This project is intentionally opinionated, but it is not hand-wavy.

It is grounded in:

- official WordPress.org plugin handbook guidance
- the official Plugin Check project
- the official Plugin Check GitHub Action workflow
- real submission and release workflow research

It is also intentionally explicit about scope:

- some checks are implemented natively here
- some are heuristic only
- some are delegated to official Plugin Check
- some are docs-only or still planned

If someone wants to challenge coverage, the project should be able to point to both source material and an honest gap map.

Use these docs as the trust layer:

- [docs/source-matrix.md](docs/source-matrix.md) for source traceability
- [docs/coverage-matrix.md](docs/coverage-matrix.md) for implemented vs delegated coverage
- [rules/README.md](rules/README.md) for how the executable rules layer is structured

The claim this repository makes is not "we cover literally everything better than WordPress."

The claim is:

- this is a practical WordPress.org compliance toolkit
- it is backed by official sources
- it exposes its current coverage honestly
- it gives developers one place to run checks, merge findings, and understand what to fix

## Why It Exists

WordPress.org submission problems are often not just code problems. They are workflow problems, packaging problems, readme problems, and “what does the reviewer actually mean?” problems.

Official tools are essential, but they do not always provide the best developer experience for:

- first-time plugin authors
- AI-assisted plugin development
- agencies preparing client plugins for submission
- release validation against the actual ZIP artifact

This project tries to sit in that gap: faster feedback, clearer explanations, one shared report model, and multiple ways to consume it.

## Best Use Cases

### First-time plugin developer

You are building your first plugin with Claude Code, Codex, or another assistant and want a submission-aware reviewer while you work.

Example flow:

```bash
./bin/wp-plugin-compliance scan /path/to/plugin
```

Ask your AI client:

- "Scan this plugin and tell me what would likely block WordPress.org approval."
- "Fix the error findings first, then rescan."

### Release preflight

You want to check the ZIP you actually plan to upload, not just your working directory.

```bash
./bin/wp-plugin-compliance scan /path/to/plugin.zip
```

This is especially useful for catching release junk such as development files, packaged archives, AI instruction files, and other review-unfriendly artifacts.

### Merge official Plugin Check output

You already ran Plugin Check elsewhere and want one combined report.

```bash
./bin/wp-plugin-compliance scan --format=json \
  --plugin-check-report plugin-check-results.txt \
  /path/to/plugin
```

or

```bash
./bin/wp-plugin-compliance scan --format=json \
  --plugin-check-json plugin-check-report.json \
  /path/to/plugin
```

### MCP workflow

You want Claude Code, Codex, or another MCP client to use the scanner directly as a tool.

```bash
node mcp/server.js
```

The MCP server can:

- scan a plugin directory
- scan a release ZIP
- merge Plugin Check results
- render markdown reports
- list rule metadata
- explain a specific rule by ID

By default, the MCP server is now secure-by-default for local use:

- scan and import paths are restricted to the current working directory unless you configure allowed roots explicitly
- imported Plugin Check reports are subject to the same path restrictions
- ZIP inputs are bounded by archive size, entry count, extracted size, and extraction timeout limits

Recommended setup:

- run the MCP server with its working directory set to the plugin workspace
- set `WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS` to that workspace path

See [docs/mcp.md](docs/mcp.md) for a copy-pasteable config example.

### Team or client reporting

You want a readable report instead of raw terminal output.

```bash
./bin/wp-plugin-compliance scan --format=json /path/to/plugin > report.json
./bin/wp-plugin-compliance report report.json
```

## Current Product Shape

### Shared Core

The repository now has a real shared core under [src/README.md](src/README.md) that powers the CLI, shell wrappers, report rendering, and MCP adapter.

### Stable Surfaces

- CLI: [bin/wp-plugin-compliance](bin/wp-plugin-compliance)
- Shell wrappers: [scripts/check-rules.sh](scripts/check-rules.sh), [scripts/check-compliance.sh](scripts/check-compliance.sh)
- Markdown renderer: [scripts/render-markdown-report.sh](scripts/render-markdown-report.sh)
- MCP server: [mcp/server.js](mcp/server.js)
- Claude skill: [skills/wp-plugin-check/SKILL.md](skills/wp-plugin-check/SKILL.md)

### Rules and Coverage

- Machine-readable rules: [rules](rules)
- Coverage planning against official Plugin Check: [docs/coverage-matrix.md](docs/coverage-matrix.md)
- Output contract: [schemas/findings-report.schema.json](schemas/findings-report.schema.json)

## Quick Start

### Scan a plugin

```bash
./bin/wp-plugin-compliance scan /path/to/your-plugin
```

### Scan a ZIP

```bash
./bin/wp-plugin-compliance scan /path/to/your-plugin.zip
```

### Emit JSON

```bash
./bin/wp-plugin-compliance scan --format=json /path/to/your-plugin
```

### Merge Plugin Check output

```bash
./bin/wp-plugin-compliance scan --format=json \
  --plugin-check-report plugin-check-results.txt \
  /path/to/your-plugin
```

### Auto-discover action-style Plugin Check artifacts

```bash
./bin/wp-plugin-compliance scan --format=json \
  --plugin-check-auto \
  /path/to/your-plugin
```

### Render a markdown report

```bash
./bin/wp-plugin-compliance report report.json
```

### Run the full local verification suite

```bash
./bin/wp-plugin-compliance test
```

## MCP

This repository now includes a functioning MCP stdio server in [mcp/server.js](mcp/server.js).

Tools exposed today:

- `scan_plugin`
- `render_report`
- `list_rules`
- `get_rule`

That means this is no longer just "MCP-ready." It is an actual working MCP server on top of the shared compliance engine.

See [docs/mcp.md](docs/mcp.md) for the current MCP contract.

Security note:

- MCP is not "risk-free just because it is a layer"
- this server is intentionally thin and does not expose arbitrary shell execution
- it now defaults to workspace-scoped path access instead of unrestricted local reads

## What The Report Model Gives You

The shared JSON report can represent:

- project-native heuristic findings
- imported official Plugin Check findings
- source-by-source totals
- imported report metadata
- one merged verdict and summary

That makes it useful for:

- CI decisions
- AI agent tool calls
- markdown report generation
- future editor integrations

See [docs/output-format.md](docs/output-format.md) and [schemas/findings-report.schema.json](schemas/findings-report.schema.json).

## Official Sources

This project is grounded in official WordPress.org sources and the official Plugin Check codebase.

Primary references:

- [Detailed Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/)
- [Common Issues](https://developer.wordpress.org/plugins/wordpress-org/common-issues/)
- [How Your readme.txt Works](https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/)
- [Plugin Assets](https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/)
- [How to Use Subversion](https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/)
- [Plugin Developer FAQ](https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/)
- [Plugin Check on WordPress.org](https://wordpress.org/plugins/plugin-check/)
- [Plugin Check source code](https://github.com/WordPress/plugin-check)
- [Plugin Check Action](https://github.com/WordPress/plugin-check-action)

Supporting repo docs:

- [docs/architecture.md](docs/architecture.md)
- [docs/coverage-matrix.md](docs/coverage-matrix.md)
- [docs/source-matrix.md](docs/source-matrix.md)
- [rules/README.md](rules/README.md)

These references are there on purpose. They are part of the product's trust model, not filler.

## Current Limits

This repository is already useful, but it is not yet the final vision.

It does not currently:

- implement the full official Plugin Check rule surface itself
- guarantee WordPress.org approval
- replace human review by the plugins team
- prove logical security correctness
- eliminate heuristic false positives
- directly execute live `wp plugin check` on this machine right now

The last point is environmental: direct execution is the natural next step, but this machine currently does not have `php` or `wp` installed.

## Repository Map

```text
docs/       Handbook guidance, architecture, coverage, integration docs
rules/      Machine-readable rule definitions and schema-linked data
scripts/    Shell-compatible entry points
skills/     AI adapters, starting with Claude
src/        Shared core engine, importer, renderer, and CLI logic
mcp/        MCP server and adapter layer
tests/      Fixture-based regression coverage
templates/  Submission-ready supporting files
```

## Documentation

### Core Product Docs

- [docs/cli.md](docs/cli.md)
- [docs/mcp.md](docs/mcp.md)
- [docs/output-format.md](docs/output-format.md)
- [docs/integrations.md](docs/integrations.md)
- [docs/testing.md](docs/testing.md)

### WordPress.org Process Docs

- [docs/01-code-requirements.md](docs/01-code-requirements.md)
- [docs/02-file-structure.md](docs/02-file-structure.md)
- [docs/03-readme-txt.md](docs/03-readme-txt.md)
- [docs/04-plugin-assets.md](docs/04-plugin-assets.md)
- [docs/05-svn-workflow.md](docs/05-svn-workflow.md)
- [docs/06-official-guidelines.md](docs/06-official-guidelines.md)
- [docs/07-plugin-check-tool.md](docs/07-plugin-check-tool.md)
- [docs/08-common-rejections.md](docs/08-common-rejections.md)
- [docs/09-post-approval.md](docs/09-post-approval.md)

## Contributing

Contributions are especially valuable in these areas:

- rule extraction from official sources
- false-positive reduction
- wider Plugin Check import normalization
- coverage expansion against official checks
- new fixture plugins and regression tests
- adapter work for MCP, CI, and future editor integrations

When adding new guidance or checks, prefer official sources and include links.

## License

MIT License. See [LICENSE](LICENSE).

## Credits

Built by [Sant Limited](https://sant.nz) from real WordPress.org submission work, including the first-submission approval of [Sant Chat AI](https://wordpress.org/plugins/sant-chat-ai/).
