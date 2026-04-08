# WordPress.org Plugin Compliance Checker

WordPress.org submission guidance, preflight checks, merged Plugin Check reporting, and MCP tooling for plugin developers and AI coding assistants.

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

## Installation

```bash
# Clone the repository
git clone https://github.com/jeewandaniel/wp-plugin-compliance-checker.git
cd wp-plugin-compliance-checker

# Or install globally via npm (coming soon)
# npm install -g wp-plugin-compliance-checker
```

No dependencies required — runs on Node.js 18+ out of the box.

### Optional: Enhanced AST Parsing

For context-aware detection that can distinguish between actual function calls vs strings/comments, install the optional php-parser dependency:

```bash
npm install php-parser
```

This enables AST-based rules that reduce false positives by understanding PHP code structure. Without it, the scanner falls back to regex-based detection which works well for most cases.

## What This Is

This project helps WordPress plugin developers catch common WordPress.org submission problems before review, understand what the official rules actually mean, and turn that guidance into a workflow that works in:

- a local CLI
- an MCP client such as Claude Code or Codex
- shell scripts and CI
- markdown reports for teams and clients

It is designed to complement the official WordPress Plugin Check ecosystem, not replace it.

## What You Can Do Today

This repository is already usable as a real toolchain.

- Scan a plugin directory or release ZIP before submission.
- Filter out vendor false-positives natively using a `.wpignore` file.
- Generate human-readable reports, JSON artifacts, or GitHub PR automated comments.
- **Auto-execute** and seamlessly merge the official `wp plugin check` natively via `--run-wp-cli`.
- Import raw `wp plugin check --format=json` result files when running in disconnected CI environments.
- Automatically **auto-fix** trivially failing compliance rules directly using the `--fix` flag.
- Expose the same behavior through a real MCP server.
- Run entirely as a native GitHub Action to block failing PRs.

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

### Run or Merge Official Plugin Check Output

You can configure the tool to automatically execute the official CLI tool (if installed on your machine) and natively merge the findings without you lifting a finger:

```bash
./bin/wp-plugin-compliance scan --run-wp-cli /path/to/plugin
```

If you ran Plugin Check elsewhere and want to manually combine reports in CI, you can import them:

```bash
./bin/wp-plugin-compliance scan --format=json \
  --plugin-check-report plugin-check-results.txt \
  /path/to/plugin
```

### Auto-Fixing and Ignoring False Positives

Tired of the scanner flagging libraries like `vendor` or `node_modules`? Drop a `.wpignore` file in the root of your plugin directory containing those folder names to completely exclude them from the scan.

If you made simple mistakes (like capitalizing 'Wordpress' incorrectly in your `readme.txt`), you can ask the CLI to automatically patch the files for you:

```bash
./bin/wp-plugin-compliance scan --fix /path/to/plugin
```

### Incremental Scanning

For faster rescans during development, use the `--incremental` flag to skip unchanged files:

```bash
./bin/wp-plugin-compliance scan --incremental /path/to/plugin
```

This creates a `.wp-compliance-cache.json` file in your plugin directory that tracks file hashes. Subsequent scans will only re-analyze files that have changed, significantly speeding up large plugin analysis.

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

### Check version

```bash
./bin/wp-plugin-compliance version
```

## Exit Codes

The CLI uses standardized exit codes for CI integration:

| Code | Meaning |
|------|---------|
| 0 | Clean scan — no errors found |
| 1 | Findings exist — at least one error detected |
| 2 | Scan error — invalid path, ZIP extraction failure, or similar |
| 3 | Configuration error — invalid arguments or options |

Example CI usage:

```bash
./bin/wp-plugin-compliance scan ./my-plugin
if [ $? -eq 0 ]; then
  echo "Plugin is ready for submission"
elif [ $? -eq 1 ]; then
  echo "Plugin has compliance issues"
else
  echo "Scan failed"
fi
```

## GitHub Actions Integration

This repository can be cleanly incorporated into your CI/CD pipelines as a Composite Action. It natively wires up the CLI execution logic for you.

```yaml
- name: Run Plugin Compliance Scanner
  id: compliance
  uses: jeewandaniel/wp-plugin-compliance-checker@main
  with:
    plugin_dir: '.'
    run_wp_cli: 'false'
    fail_on_error: 'true'

- name: Post PR Comment
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${{ steps.compliance.outputs.pr_comment }}`
      })
```

### Action Outputs

The action provides these outputs for downstream steps:

| Output | Description |
|--------|-------------|
| `exit_code` | Exit code (0=clean, 1=findings, 2=error) |
| `errors` | Total number of errors found |
| `warnings` | Total number of warnings found |
| `report_path` | Path to the JSON report file |
| `pr_comment` | Markdown content ready for PR comments |
| `verdict` | `ready_for_deeper_review` or `needs_attention` |

## MCP Server

This repository includes a functioning MCP stdio server for AI coding assistants like Claude Code, Cursor, or Codex.

### Claude Code Setup

Add to your `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wp-plugin-compliance": {
      "command": "node",
      "args": ["/path/to/wp-plugin-compliance-checker/mcp/server.js"],
      "env": {
        "WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS": "/path/to/your/plugins"
      }
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `scan_plugin` | Scan a plugin directory or ZIP, return structured findings |
| `render_report` | Generate a markdown compliance report |
| `list_rules` | List all rules with optional filtering by category/severity |
| `get_rule` | Get full details for a specific rule by ID |

### Example Prompts

Once configured, ask your AI assistant:

- *"Scan my plugin at /path/to/plugin and explain what would block WordPress.org approval"*
- *"List all security rules and explain what they check for"*
- *"Generate a compliance report for my-plugin.zip"*

### Security

- Paths are restricted to configured `WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS` by default
- ZIP extraction is bounded by size, entry count, and timeout limits
- No arbitrary shell execution — the server is intentionally thin

See [docs/mcp.md](docs/mcp.md) for the full MCP contract.

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

Distributed under the GPLv2 License. See [LICENSE](LICENSE) for more information.

## Credits

Built by [Sant Limited](https://sant.nz) from real WordPress.org submission work, including the first-submission approval of [Sant Chat AI](https://wordpress.org/plugins/sant-chat-ai/).
