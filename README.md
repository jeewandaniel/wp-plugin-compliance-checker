# WordPress.org Plugin Compliance Checker

**A comprehensive toolkit for WordPress plugins targeting the official WordPress.org plugin directory — from pre-submission validation through approval to going live via SVN.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What This Covers

This tool guides you through the **entire WordPress.org plugin lifecycle**:

| Phase | Documentation |
|-------|---------------|
| **Pre-Submission** | Code requirements, security checks, file structure, readme.txt validation |
| **Submission** | Plugin Check tool, common rejection reasons, fix examples |
| **Post-Approval** | SVN setup, first upload, creating assets (banners/icons), tagging releases |
| **Maintenance** | Releasing updates, security patches, "Tested up to" updates |

---

## Why This Exists

**Only ~1% of WordPress plugins pass the WordPress.org review on their first submission attempt.**

The WordPress.org plugin review process is notoriously strict. The review team checks for security vulnerabilities, coding standards compliance, policy violations, and dozens of other requirements. Most developers go through 3+ revision cycles before approval.

This tool was created after successfully getting [Sant Chat AI](https://wordpress.org/plugins/sant-chat-ai/) approved on the **first submission attempt** (April 2026) — a rare achievement that required extensive research into exactly what the review team looks for.

---

## What This Tool Checks

This compliance checker validates your plugin against the **actual requirements** that cause rejections:

| Category | Checks Performed |
|----------|------------------|
| **Security** | Input sanitization, output escaping, nonce verification, capability checks, SQL injection prevention, direct file access protection |
| **Code Quality** | Inline styles/scripts detection, function prefixing, forbidden functions, HEREDOC usage, WordPress library bundling |
| **File Structure** | Forbidden files (.sh, .phar, .exe), forbidden directories (node_modules, .git, AI configs), AI instruction files |
| **readme.txt** | Version consistency, stable tag validation, tag count limits, required sections |
| **Policy Compliance** | Localhost references, update checker detection, trademark violations |

---

## Official Sources

This tool is built from **official WordPress.org documentation and tools**, not guesswork:

### Primary Sources

| Source | URL | What It Covers |
|--------|-----|----------------|
| **Detailed Plugin Guidelines** | [developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/) | All 18 official guidelines (GPL, trialware, tracking, external services, admin behavior, etc.) |
| **How to Use Subversion** | [developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/](https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/) | SVN commands, directory structure, tagging releases |
| **How readme.txt Works** | [developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/](https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/) | Header requirements, sections, markdown support |
| **Plugin Assets** | [developer.wordpress.org/plugins/wordpress-org/plugin-assets/](https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/) | Banner sizes, icon requirements, screenshot naming |
| **Plugin Check Tool** | [wordpress.org/plugins/plugin-check/](https://wordpress.org/plugins/plugin-check/) | Official automated checker (PHPCS rules, file detection) |
| **Plugin Team Blog** | [make.wordpress.org/plugins/](https://make.wordpress.org/plugins/) | Policy updates, new requirements, statistics |

### Additional References

- [WordPress Security APIs](https://developer.wordpress.org/apis/security/) — Sanitization, escaping, nonces
- [PHP Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/) — WordPress-specific PHP standards
- [Plugin Check GitHub](https://github.com/WordPress/plugin-check) — Source code revealing exact detection patterns
- [Readme Validator](https://wordpress.org/plugins/developers/readme-validator/) — Official validation tool

---

## How This Was Built

### Research Process

1. **Official Documentation Review** — Read every page of the WordPress.org plugin developer documentation
2. **Plugin Check Source Analysis** — Examined the [Plugin Check GitHub repo](https://github.com/WordPress/plugin-check) to understand exact PHPCS sniffs and file detection patterns
3. **Community Research** — Analyzed WordPress.org support forums, GitHub issues, and developer blog posts about rejection reasons
4. **Real-World Testing** — Applied findings to [Sant Chat AI](https://wordpress.org/plugins/sant-chat-ai/), achieving first-submission approval

### Key Statistics Discovered

- **~1% first-pass approval rate** (historically)
- **69.5% overall approval rate** (2025 data)
- **Average 3 interactions** per plugin before approval
- **85% of initial reviews** now AI-automated (as of 2025)
- **500+ submissions per week** (as of March 2026)
- **Plugin Check integration (Sep 2024)** reduced issues by 41%

### New Requirements (2025-2026)

- **English readme.txt required** (July 2025) — Description must be in English
- **AI instruction file detection** (Plugin Check 1.8+) — .cursor/, .claude/, CLAUDE.md, etc.
- **HEREDOC sniff** — HEREDOC syntax now flagged (prevents escaping detection)
- **Plugin Namer tool** — AI-powered name validation (WordPress 7.0+)

---

## Documentation Structure

```
docs/
├── 01-code-requirements.md     # Security: sanitization, escaping, nonces, SQL
├── 02-file-structure.md        # Directory layout, forbidden files, headers
├── 03-readme-txt.md            # Complete readme.txt formatting guide
├── 04-plugin-assets.md         # Banners, icons, screenshots (SVN assets/)
├── 05-svn-workflow.md          # Complete SVN guide for WP.org hosting
├── 06-official-guidelines.md   # All 18 official guidelines with numbers
├── 07-plugin-check-tool.md     # Using the official Plugin Check tool
├── 08-common-rejections.md     # Top 20 rejection reasons, ranked
└── 09-post-approval.md         # Updates, maintenance, staged releases
```

---

## Usage

### As a Claude Code Skill

```bash
# Install
git clone https://github.com/jeewandaniel/wp-plugin-compliance-checker.git
cp -r wp-plugin-compliance-checker/skills/wp-plugin-check ~/.claude/skills/

# Use
/wp-plugin-check /path/to/your-plugin
```

### Command Line Script

```bash
# Make executable
chmod +x scripts/check-compliance.sh

# Run
./scripts/check-compliance.sh /path/to/your-plugin
```

### Manual Checks

See `docs/08-common-rejections.md` for grep commands you can run manually.

---

## Quick Reference: Top 5 Rejection Reasons

| # | Issue | Fix |
|---|-------|-----|
| 1 | Inline `<style>`/`<script>` tags | Use `wp_enqueue_*()` + `wp_add_inline_*()` |
| 2 | Missing input sanitization | `sanitize_text_field(wp_unslash($_POST['x']))` |
| 3 | Missing output escaping | `esc_html()`, `esc_attr()`, `esc_url()` |
| 4 | Missing nonce verification | `wp_nonce_field()` + `wp_verify_nonce()` |
| 5 | Generic function names | Use 4+ character unique prefix (`myplugin_`) |

---

## Quick Reference: Going Live After Approval

After your plugin is approved, you'll receive two emails:
1. **Review Complete** — General SVN instructions
2. **Approval Email** — Your specific SVN URL and username

### First-Time SVN Upload

```bash
# 1. Set SVN password at: https://profiles.wordpress.org/me/profile/edit/group/3/?screen=svn-password

# 2. Checkout your empty repo
svn co https://plugins.svn.wordpress.org/your-plugin-slug ~/your-plugin-svn
cd ~/your-plugin-svn

# 3. Copy plugin files to trunk (NOT zipped)
cp -r /path/to/your-plugin/* trunk/

# 4. Create assets folder and add images
mkdir -p assets
cp banner-772x250.png icon-128x128.png screenshot-1.png assets/

# 5. Add files and set MIME types
svn add trunk/* assets/*
svn propset svn:mime-type image/png assets/*.png

# 6. Commit and tag
svn ci -m "Initial release v1.0.0"
svn cp trunk tags/1.0.0
svn ci -m "Tagging version 1.0.0"
```

### Required Assets

| Asset | Size | Required |
|-------|------|----------|
| `banner-772x250.png` | 772×250px | Yes |
| `banner-1544x500.png` | 1544×500px | Recommended (retina) |
| `icon-128x128.png` | 128×128px | Yes |
| `icon-256x256.png` | 256×256px | Recommended (retina) |
| `screenshot-N.png` | Any | Match readme.txt |

### Important Timing

- **Plugin files:** May take up to 6 hours to appear
- **Search results:** May take up to **72 hours** to update
- **Asset images:** May take up to 24 hours to display

See `docs/05-svn-workflow.md` and `docs/09-post-approval.md` for complete guides.

---

## Maintenance

This tool will be updated when:

- WordPress.org publishes new guidelines
- Plugin Check tool adds new checks
- New rejection patterns emerge from the community
- WordPress releases require compatibility updates

**Last Updated:** April 2026
**Maintainer:** [Sant Limited](https://sant.nz)

---

## Limitations

This tool catches common issues but is **not a replacement** for:

1. **The official Plugin Check tool** — Install it: [wordpress.org/plugins/plugin-check/](https://wordpress.org/plugins/plugin-check/)
2. **Human review** — The WordPress.org team may catch issues this tool misses
3. **Security audits** — This checks patterns, not logic vulnerabilities
4. **Full PHPCS analysis** — Use WordPress Coding Standards PHPCS ruleset for complete analysis

**Always run the official Plugin Check before submission.**

---

## Contributing

Contributions welcome! Please ensure additions are:

1. Verified against official WordPress.org documentation
2. Tested against real plugins
3. Include source links for any new rules

---

## License

MIT License — See [LICENSE](LICENSE)

---

## Credits

Built by [Sant Limited](https://sant.nz) based on the experience of getting [Sant Chat AI](https://wordpress.org/plugins/sant-chat-ai/) approved on first submission.

**Research compiled from:**
- WordPress.org Plugin Directory Team documentation
- Plugin Check tool source code analysis
- WordPress developer community knowledge
- Real-world submission experience
