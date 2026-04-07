# Coverage Matrix

This matrix compares the current repository against the default checks registered by the official WordPress Plugin Check project.

Status values:

- `delegated` - better handled by official Plugin Check for now
- `partial` - the repo has some coverage, but not complete or authoritative coverage
- `heuristic` - covered today with simple grep/file heuristics
- `docs-only` - documented, but not checked automatically
- `planned` - intended for the neutral core

The point of this matrix is to stay honest about what the project really covers.

---

## Official Plugin Check Coverage

| Check | Category | Current repo status | Planned strategy |
|-------|----------|---------------------|------------------|
| `i18n_usage` | general, plugin_repo | docs-only | delegate initially, then wrap with better fix guidance |
| `code_obfuscation` | plugin_repo | docs-only | delegate initially |
| `plugin_content` | plugin_repo | docs-only | planned as rules plus docs |
| `direct_file_access` | security, plugin_repo | partial | implement in core and keep docs |
| `file_type` | plugin_repo | heuristic | expand in core with structured rules |
| `plugin_header_fields` | plugin_repo | docs-only | planned as rules plus metadata checks |
| `late_escaping` | security, plugin_repo | heuristic | improve in core, still delegate for authoritative static analysis |
| `safe_redirect` | security | docs-only | planned |
| `plugin_updater` | plugin_repo | docs-only | planned |
| `plugin_uninstall` | plugin_repo | docs-only | planned |
| `external_admin_menu_links` | plugin_repo | docs-only | planned |
| `plugin_review_phpcs` | plugin_repo | delegated | delegate, enrich output |
| `direct_db_queries` | security, plugin_repo | partial | planned |
| `direct_db` | security, plugin_repo | docs-only | planned |
| `performant_wp_query_params` | performance | docs-only | delegated initially |
| `enqueued_scripts_in_footer` | performance | docs-only | delegated initially |
| `enqueued_resources` | plugin_repo, performance | partial | planned |
| `plugin_readme` | plugin_repo | partial | expand as core metadata/readme checks |
| `localhost` | plugin_repo | heuristic | keep, improve patterns |
| `minified_files` | plugin_repo | docs-only | planned |
| `no_unfiltered_uploads` | plugin_repo | heuristic | keep, formalize as rule |
| `trademarks` | plugin_repo | docs-only | planned |
| `offloading_files` | plugin_repo | docs-only | planned |
| `setting_sanitization` | plugin_repo | docs-only | planned |
| `prefixing` | plugin_repo | partial | improve in core, delegate for parity where needed |
| `enqueued_scripts_size` | performance | docs-only | delegated initially |
| `enqueued_styles_size` | performance | docs-only | delegated initially |
| `enqueued_styles_scope` | performance | docs-only | delegated initially |
| `enqueued_scripts_scope` | performance | docs-only | delegated initially |
| `non_blocking_scripts` | performance | docs-only | delegated initially |

---

## Current Native Strengths

The current repository already adds value in these areas:

- lifecycle documentation before and after approval
- readable explanations of why common blockers matter
- quick shell-based preflight checks
- WordPress.org workflow templates
- AI-friendly review guidance

These are worth preserving while the engine matures.

---

## Intentional Non-Goals for Early Core Work

The first core engine should not try to beat the official Plugin Check project at its own job.

Instead, early core work should focus on:

- release artifact inspection
- structured reporting
- rule-to-source traceability
- custom high-value project checks
- improved remediation guidance
- adapter portability

---

## Revisit Points

This matrix should be reviewed whenever:

- Plugin Check adds or removes default checks
- handbook policy changes introduce new review blockers
- the neutral core implements a planned area
- a heuristic rule proves too noisy to keep
