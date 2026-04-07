# Rules

This directory is the beginning of the source-of-truth layer for the project.

Rules should eventually power:

- terminal reporting
- AI explanations
- CI output
- coverage tracking
- documentation cross-linking

They should not be treated as a replacement for the official Plugin Check project. Some rules in this repository will remain delegated to official tooling.

---

## Layout

```text
rules/
  index.json
  schema.json
  plugin-repo/
  security/
  readme/
```

Each rule file should describe one issue or closely related group of issues with a stable ID.

---

## Authoring Principles

### Use Stable Rule IDs

Rule IDs should be durable and machine-friendly, for example:

- `plugin_repo.no_inline_style_tags`
- `security.no_unsanitized_superglobals`

### Separate Official From Project Opinion

Use explicit metadata to show where a rule comes from:

- official handbook
- official Plugin Check behavior
- project heuristic
- field experience

### Model Coverage Honestly

Each rule should indicate whether it is:

- implemented
- heuristic
- delegated
- docs-only
- planned

### Prefer Small, Specific Rules

Avoid giant rule files that mix unrelated concerns. Smaller rules are easier to test, explain, and evolve.

---

## Required Rule Information

The schema in `schema.json` defines the rule shape, but each rule should at minimum answer:

- what is the problem
- why does WordPress.org care
- where is the official source
- how should the engine try to detect it
- what is the likely fix
- what false positives are expected

---

## Relationship to Existing Scripts and Skills

The current shell script and Claude skill predate this rules layer.

As the project evolves:

- shell checks should be mapped to rule IDs
- AI prompts should reference rule IDs instead of hard-coded grep blocks
- docs should increasingly link back to the same rules

That is how the repository becomes a shared platform instead of multiple copies of the same logic.
