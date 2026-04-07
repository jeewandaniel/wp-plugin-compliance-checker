---
name: wp-plugin-check
description: Run the repository's shared WordPress.org compliance scan and explain the findings in submission-ready language. Uses the same rules-driven runner as the CLI instead of duplicating shell checks inline.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash Read
argument-hint: [path-to-plugin-directory]
---

# WordPress.org Plugin Compliance Checker

Use the repository's shared runner instead of re-implementing checks inside the skill.

## Target Plugin

Check plugin at: $ARGUMENTS

If no path is provided, ask the user for the plugin directory path.

---

## Workflow

1. Run the rules-driven scan in JSON mode:

```bash
scripts/check-rules.sh --format=json "$ARGUMENTS"
```

2. Read the JSON output and summarize:

- total errors
- total warnings
- the highest-priority rule IDs
- concrete fixes with WordPress-specific wording

3. If the user wants a polished report, render markdown too:

```bash
scripts/check-rules.sh --format=json "$ARGUMENTS" > /tmp/wp-plugin-check-report.json
scripts/render-markdown-report.sh /tmp/wp-plugin-check-report.json
```

4. Always remind the user that this complements, but does not replace, the official WordPress Plugin Check workflow.

---

## Report Format

When replying, use this structure:

```markdown
## WP.org Compliance Report for [Plugin Name]

### Summary
- Errors: X
- Warnings: X
- Executed rules: X

### Highest Priority Findings
1. [rule_id] Short explanation and fix

### Recommended Next Steps
1. Re-run this scan after fixes
2. Run the official Plugin Check plugin
3. Review readme.txt and release artifact contents before submission
```

Keep the response grounded in the actual JSON findings. Do not invent checks that the runner did not report.

---

## Important Notes

- The skill is an adapter over the shared runner, not a separate rule engine.
- Prefer rule IDs from the JSON output so users can trace findings back to the repository rules.
- If the scan returns zero errors and zero warnings, say that clearly, but still recommend the official Plugin Check plugin.

---

## Reference Documentation

- `docs/architecture.md`
- `docs/coverage-matrix.md`
- `docs/output-format.md`
- `docs/testing.md`
