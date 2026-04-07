# Testing

This project now includes a fixture-based regression test loop for the rules-driven runner.

---

## Why Fixtures Exist

The rules layer is only useful if changes can be checked against known examples.

Fixtures help us verify that:

- expected issues are still detected
- passing plugins do not regress into noisy failures
- changes to rules or the runner do not silently alter behavior

---

## Current Test Harness

Run the current regression suite:

```bash
node tests/test-core-engine.js
bash tests/test-rules-runner.sh
bash tests/test-compat-wrapper.sh
bash tests/test-reporting.sh
bash tests/test-mcp-smoke.sh
```

Or run the full project test entrypoint:

```bash
./bin/wp-plugin-compliance test
```

The suite exercises the shared core engine, the shell-compatible runner, the legacy compatibility wrapper, the markdown renderer, and the MCP adapter against fixture plugins under `fixtures/`.

It also uses:

- `tests/plugin-check-sample.json`
- `tests/plugin-check-results.txt`

to verify merged-report behavior across multiple upstream-like formats.

---

## Current Fixture Groups

### Passing

- `fixtures/pass/minimal-pass`

### Failing

- `fixtures/fail/inline-style`
- `fixtures/fail/naming-and-readme`
- `fixtures/fail/release-artifacts`
- `fixtures/fail/localhost-and-heredoc`

Each failing fixture is designed to exercise one or two specific rules so that failures are easy to interpret.

---

## What The Tests Assert

The current tests check:

- direct core-engine behavior without shell wrappers
- ZIP release artifact scanning through the shared engine
- process exit code behavior
- presence of rule IDs in runner output
- warning-only cases that should not fail the run
- JSON output shape and summary counts
- merged-report behavior with imported Plugin Check findings
- compatibility wrapper behavior through the legacy shell entrypoint
- markdown report rendering from structured JSON
- MCP tool behavior through the stdio server
- MCP path restriction behavior for out-of-scope plugin and report inputs

This is intentionally lightweight for now, but it gives the project a real regression baseline while the neutral core is still emerging.

---

## Near-Term Testing Upgrades

The next test improvements should be:

- fixture coverage for more rules
- JSON output snapshots once the schema settles
- release-archive focused fixtures
- parity checks for delegated areas that wrap official Plugin Check output

---

## Contribution Guidance

When adding a new executable rule:

1. Add or update the rule definition in `rules/`.
2. Add a pass or fail fixture when practical.
3. Extend `tests/test-rules-runner.sh` to assert the intended behavior.

That discipline will matter more as the project adds more rule coverage.
