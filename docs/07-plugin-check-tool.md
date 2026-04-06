# Plugin Check Tool

The official WordPress.org Plugin Check tool helps validate plugins before submission.

**Plugin:** https://wordpress.org/plugins/plugin-check/
**GitHub:** https://github.com/WordPress/plugin-check

---

## Installation

### Via WordPress Admin

1. Go to **Plugins > Add New**
2. Search for "Plugin Check"
3. Install and activate

### Via WP-CLI

```bash
wp plugin install plugin-check --activate
```

---

## Usage

### Via WordPress Admin

1. Go to **Tools > Plugin Check**
2. Select your plugin from the dropdown
3. Choose check categories
4. Click "Check it!"

### Via WP-CLI

```bash
# Basic check
wp plugin check my-plugin

# Check specific plugin file
wp plugin check hello.php

# Check from path
wp plugin check /path/to/plugin

# Check from URL
wp plugin check https://example.com/plugin.zip

# Include runtime checks (requires special loading)
wp plugin check my-plugin --require=./wp-content/plugins/plugin-check/cli.php
```

---

## Check Categories

### Plugin Repo (Required for WP.org)

These must pass for WordPress.org submission:

- Code obfuscation detection
- File type restrictions
- Security checks (sanitization, escaping, nonces)
- License compatibility
- Readme validation

### Security

- Input sanitization
- Output escaping
- Nonce verification
- Direct database query detection
- Capability checks

### Performance

- Enqueued scripts scope
- Enqueued styles size
- Blocking scripts detection

### Accessibility

- Basic a11y checks

---

## Checks Performed (v1.9.0)

### Code Quality

| Check | Description |
|-------|-------------|
| Inline Styles/Scripts | Detects `<style>` and `<script>` tags in PHP |
| Function Prefixing | Ensures unique function/class prefixes |
| HEREDOC Detection | Flags HEREDOC usage (NOWDOC allowed) |
| Minified File Detection | Identifies minified files without source |
| Code Obfuscation | Detects encoded/obfuscated code |

### Security

| Check | Description |
|-------|-------------|
| Sanitization | Missing `sanitize_*()` on inputs |
| Escaping | Missing `esc_*()` on outputs |
| Nonce Verification | Insecure `wp_verify_nonce()` usage |
| Direct Database Queries | `$wpdb` queries without `prepare()` |
| Forbidden Functions | `eval()`, `passthru()`, etc. |
| ALLOW_UNFILTERED_UPLOADS | Detects this dangerous constant |
| Direct File Access | Missing ABSPATH check |

### Readme

| Check | Description |
|-------|-------------|
| Stable Tag | Must not be "trunk" |
| Version Match | Must match plugin header |
| Contributors | Must be valid WP.org usernames |
| Tags | Maximum 5 tags |
| Tested Up To | Must be valid WP version |
| License | Must be GPL-compatible |

### Files

| Check | Description |
|-------|-------------|
| Forbidden Files | .sh, .phar, .exe, etc. |
| AI Directories | .cursor, .claude, .ai, etc. |
| Localhost URLs | Development URLs in code |
| WordPress Libraries | Bundled core libraries |

### Plugin Header

| Check | Description |
|-------|-------------|
| Plugin Name | Must be valid, not generic |
| Plugin URI | Must be valid URL |
| Description | Cannot be default text |
| Text Domain | Must match slug |
| Version | Must be valid format |

---

## New in v1.9.0

- **AI-powered Plugin Namer** — Evaluate names for trademark conflicts (requires WP 7.0+)
- **External Admin Menu Links** — Detects external URLs in top-level admin menus
- **Block API Version** — Requires `apiVersion` 3+ for WP 7.0+ compatibility
- **Plugin Updater Detection** — Identifies Plugin Update Checker (PUC) calls
- **WTFPL License** — Now accepted as GPL-compatible

---

## Handling False Positives

Some checks may flag legitimate code. Use PHPCS comments to suppress:

```php
// Single line
// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Public REST endpoint
$data = sanitize_text_field(wp_unslash($_POST['data']));

// Block of code
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
$results = $wpdb->get_results($query);
// phpcs:enable
```

---

## Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `WordPress.Security.EscapeOutput` | Output not escaped | Add `esc_html()`, `esc_attr()`, etc. |
| `WordPress.Security.ValidatedSanitizedInput` | Input not sanitized | Add `sanitize_text_field()`, etc. |
| `WordPress.Security.NonceVerification` | Missing nonce check | Add `wp_verify_nonce()` or phpcs:ignore |
| `WordPress.DB.PreparedSQL` | SQL not prepared | Use `$wpdb->prepare()` |
| `WordPress.WP.EnqueuedResources` | Inline script/style | Move to external file + enqueue |
| `WordPress.NamingConventions.PrefixAllGlobals` | Missing prefix | Add 4+ char prefix |

---

## Export Results

Plugin Check 1.8+ supports exporting results:

- CSV format
- JSON format
- Markdown format

Useful for CI/CD integration and record-keeping.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Plugin Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup WordPress
        uses: WordPress/wordpress-develop/.github/actions/setup-wordpress@trunk

      - name: Install Plugin Check
        run: wp plugin install plugin-check --activate

      - name: Run Plugin Check
        run: wp plugin check ./my-plugin --format=json
```

---

## Tips

1. **Run before every submission** — Even if you passed before, new checks are added
2. **Fix errors first** — Warnings are secondary
3. **Don't suppress everything** — Only suppress legitimate false positives
4. **Check the changelog** — New versions add new checks
5. **Use --format=json** — For CI/CD integration
6. **Test with runtime checks** — Some issues only appear at runtime
