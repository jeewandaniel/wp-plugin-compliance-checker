# Architecture

This document describes the target architecture for turning this repository into a source-of-truth compliance platform instead of a collection of disconnected docs and prompts.

---

## Goals

The project should eventually provide:

- one machine-readable rules layer
- one neutral core engine
- one canonical findings format
- multiple delivery surfaces built on top of the same result model

The repository should be useful to:

- plugin authors working manually
- teams using CI
- AI assistants that need grounded rule explanations
- agencies that need repeatable release checks

---

## Design Principles

### Official Sources First

Every rule should trace back to at least one official source whenever possible:

- WordPress developer handbook
- official Plugin Check behavior
- official Plugin Check source code
- official plugin team posts or FAQs

Field experience is useful, but it should be labeled separately from official enforcement.

### Rules as Data

Rules should not live only inside:

- shell scripts
- prompts
- one-off grep commands
- prose docs

Instead, they should live in structured files that can power docs, CLI output, AI explanations, and CI results.

### Thin Adapters

The Claude skill, the MCP server, and any CI wrappers should be thin consumers of the same neutral core. They should not each implement their own rule logic.

### Release Artifact First

The system should prefer analyzing the code that will actually ship:

- a plugin directory prepared for release
- a distribution ZIP
- a build output directory

This is more valuable than scanning a development repository with extra tooling and junk files still present.

### Trust Through Evidence

The project should be explicit about:

- what is official
- what is heuristic
- what is delegated to official Plugin Check
- where false positives are likely
- when a rule was last verified

---

## Current Repository State

The repository currently has four useful layers:

1. Human documentation in `docs/`
2. A shell preflight script in `scripts/check-compliance.sh`
3. A Claude-specific skill in `skills/wp-plugin-check/SKILL.md`
4. Templates in `templates/`

This is a good starting point, but the same logic is duplicated in multiple places and there is no structured rule source yet.

---

## Target Components

### 1. Rules Layer

Location:

- `rules/`

Responsibilities:

- define stable rule IDs
- describe severity and category
- link to official sources
- define detection strategy
- store fix guidance and examples
- expose current coverage status

This is the source of truth.

### 2. Core Engine

Location:

- `src/`

Responsibilities:

- load and validate rule definitions
- inspect plugin directories or release artifacts
- run project-native heuristic checks
- optionally merge in official `wp plugin check` results when available
- emit a canonical findings report

This is the product core.

### 3. Report Model

Planned responsibilities:

- stable finding shape for adapters
- machine-readable JSON output
- human-readable terminal output
- markdown summaries for AI and PR workflows

This prevents each adapter from inventing its own output contract.

### 4. Adapters

Locations:

- `skills/`
- `bin/`
- `mcp/`
- CI examples and workflow glue

Responsibilities:

- collect input
- call the core engine
- render or forward results

Adapters should stay small.

### 5. Documentation Layer

Location:

- `docs/`

Responsibilities:

- teach the lifecycle and review process
- explain why rules matter
- provide fix examples
- describe workflow before and after approval
- document project architecture and coverage

Docs remain opinionated and human-friendly, but should increasingly line up with the rule IDs and source links.

---

## Suggested Future Package Layout

```text
bin/        CLI entry points
docs/       Handbook-style docs plus architecture/coverage docs
fixtures/   Known-good and known-bad sample plugins
rules/      Structured rule files and schema
scripts/    Transitional helper scripts
skills/     AI adapters
src/        Neutral PHP engine
templates/  WordPress.org submission templates
tests/      Engine and fixture regression tests
```

---

## Rule Categories

The current repository content naturally clusters into these categories:

- security
- code-quality
- file-structure
- readme
- metadata
- policy
- plugin-repo
- performance
- lifecycle

Some rules should be marked as blocker-level and others as advisory.

---

## Coverage Strategy

The goal is not to blindly reimplement every official Plugin Check rule on day one.

The strategy should be:

1. Document the full official rule surface.
2. Decide which checks the project delegates to official Plugin Check.
3. Implement high-value custom checks where this project adds unique value.
4. Wrap official results with better explanations, fix guidance, and release context.

See `docs/coverage-matrix.md` for the current coverage plan.

---

## Near-Term Build Order

### Stage 1

- add structured rule schema
- extract initial rules from current shell script and docs
- create a coverage matrix against official Plugin Check
- reposition the README around the neutral architecture

### Stage 2

- create the PHP-first core engine
- load rules and validate them
- emit JSON and terminal output
- preserve the current shell entry point as a compatibility wrapper

### Stage 3

- rewrite the Claude skill to consume the shared engine
- add fixture-based tests
- add CI examples
- add release artifact scanning

### Stage 4

- harden MCP and editor-facing adapters
- merge official Plugin Check output into the report model
- add richer guidance and remediation output

---

## Definition of Success

This project is on the right path when:

- the same rule ID appears in docs, CLI findings, and AI explanations
- there is a clear distinction between official checks and project heuristics
- contributors can add rules without editing prompts or shell scripts in multiple places
- plugin authors can use the project without needing Claude
- AI adapters add convenience, not hidden logic
