# Source Matrix

This matrix tracks the currently executable project rules against their primary sources.

The purpose is to keep the project explicit about:

- where a rule came from
- whether the project implements it directly or heuristically
- which official references should be checked when the rule changes

---

## Executable Rules

| Rule ID | Current Coverage | Primary Sources |
|--------|------------------|-----------------|
| `plugin_repo.no_inline_style_tags` | Heuristic | Plugin Check docs, Plugin Check project |
| `plugin_repo.no_inline_script_tags` | Heuristic | Plugin Check docs, Plugin Check project |
| `security.no_unsanitized_superglobals` | Heuristic | WordPress Security APIs, Plugin Check docs |
| `security.late_escaping` | Heuristic | WordPress Escaping docs, Plugin Check docs |
| `plugin_repo.forbidden_functions` | Heuristic | Plugin Check docs, Detailed Plugin Guidelines |
| `plugin_repo.forbidden_ai_artifacts` | Heuristic | Plugin Check docs, Detailed Plugin Guidelines |
| `plugin_repo.forbidden_release_files` | Heuristic | Plugin Check docs, Detailed Plugin Guidelines |
| `plugin_repo.leading_underscore_functions` | Heuristic | Plugin basics best practices, Plugin Check docs |
| `plugin_repo.localhost_references` | Heuristic | Plugin Check docs, Common Issues |
| `plugin_repo.heredoc_usage` | Heuristic | Plugin Check docs, Plugin basics best practices |
| `plugin_repo.stable_tag_consistency` | Heuristic | How Your readme.txt Works, Plugin Check docs |
| `plugin_repo.readme_tag_limit` | Heuristic | How Your readme.txt Works, Plugin Check docs |
| `plugin_repo.direct_file_access` | Heuristic | Plugin Check docs, File security best practices |

---

## Notes

- "Heuristic" means the project uses simpler detection than the official Plugin Check implementation.
- The official handbook or Plugin Check behavior should win if this project and upstream guidance ever diverge.
- When modifying a rule, update both the rule file in `rules/` and this matrix if the source basis changes.
