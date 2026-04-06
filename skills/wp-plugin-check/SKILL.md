---
name: wp-plugin-check
description: Comprehensive WordPress.org plugin compliance checker. Validates PHP syntax, security (sanitization, escaping, nonces), inline styles/scripts, file structure, and readme.txt. Use before WP.org submission or when checking plugin compliance.
user-invocable: true
disable-model-invocation: false
allowed-tools: Bash Grep Glob Read
argument-hint: [path-to-plugin-directory]
---

# WordPress.org Plugin Compliance Checker

**Only ~1% of plugins pass WP.org review on first attempt.** This skill runs all pre-submission checks.

## Target Plugin

Check plugin at: $ARGUMENTS

If no path provided, ask the user for the plugin directory path.

---

## CHECK PROCEDURE

Run ALL checks below and report findings:

### PHASE 1: Inline Styles & Scripts (Most Common Rejection)

```bash
PLUGIN_DIR="$ARGUMENTS"
echo "=== INLINE STYLES (CRITICAL) ==="
grep -rn "<style" --include="*.php" "$PLUGIN_DIR" | grep -v "preg_replace\|wp_kses\|esc_\|htmlspecialchars"

echo "=== INLINE SCRIPTS (CRITICAL) ==="
grep -rn "<script" --include="*.php" "$PLUGIN_DIR" | grep -v "preg_replace\|wp_kses\|esc_\|htmlspecialchars\|type=.application/json"
```

### PHASE 2: Input Sanitization

```bash
echo "=== UNSANITIZED \$_POST ==="
grep -rn '\$_POST\[' --include="*.php" "$PLUGIN_DIR" | grep -v "sanitize_\|absint\|intval\|wp_unslash\|isset.*\$_POST\|phpcs:ignore\|phpcs:disable"

echo "=== UNSANITIZED \$_GET ==="
grep -rn '\$_GET\[' --include="*.php" "$PLUGIN_DIR" | grep -v "sanitize_\|absint\|intval\|wp_unslash\|isset.*\$_GET\|phpcs:ignore\|phpcs:disable"

echo "=== UNSANITIZED \$_REQUEST ==="
grep -rn '\$_REQUEST\[' --include="*.php" "$PLUGIN_DIR" | grep -v "sanitize_\|absint\|intval\|wp_unslash\|phpcs:ignore\|phpcs:disable"
```

### PHASE 3: Output Escaping

```bash
echo "=== UNESCAPED ECHO ==="
grep -rn "echo \\\$" --include="*.php" "$PLUGIN_DIR" | grep -v "esc_\|wp_kses\|wp_json_encode\|json_encode\|phpcs:ignore\|phpcs:disable"
```

### PHASE 4: Function Naming

```bash
echo "=== LEADING UNDERSCORE FUNCTIONS ==="
grep -rn "function _[a-z]" --include="*.php" "$PLUGIN_DIR" | grep -v "__construct\|__destruct\|__get\|__set\|__call\|__toString\|__wakeup\|__sleep\|phpcs:ignore"
```

### PHASE 5: Forbidden Patterns

```bash
echo "=== FORBIDDEN FUNCTIONS ==="
grep -rn "eval(\|passthru(\|proc_open(\|create_function(\|str_rot13(" --include="*.php" "$PLUGIN_DIR"

echo "=== MOVE_UPLOADED_FILE ==="
grep -rn "move_uploaded_file" --include="*.php" "$PLUGIN_DIR"

echo "=== ALLOW_UNFILTERED_UPLOADS ==="
grep -rn "ALLOW_UNFILTERED_UPLOADS" --include="*.php" "$PLUGIN_DIR"

echo "=== LOCALHOST REFERENCES ==="
grep -rn "localhost\|127\.0\.0\.1" --include="*.php" "$PLUGIN_DIR" | grep -v "phpcs:ignore"

echo "=== HEREDOC USAGE ==="
grep -rn "<<<" --include="*.php" "$PLUGIN_DIR"
```

### PHASE 6: File Structure

```bash
echo "=== FORBIDDEN FILES ==="
find "$PLUGIN_DIR" \( -name "*.sh" -o -name "*.phar" -o -name "*.exe" -o -name "*.zip" \) 2>/dev/null

echo "=== FORBIDDEN DIRECTORIES ==="
find "$PLUGIN_DIR" -type d \( -name "node_modules" -o -name ".git" -o -name ".svn" -o -name ".cursor" -o -name ".claude" -o -name ".ai" \) 2>/dev/null

echo "=== AI INSTRUCTION FILES ==="
find "$PLUGIN_DIR" \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".cursorrules" -o -name "CLAUDE-REFERENCE.md" \) 2>/dev/null
```

### PHASE 7: Version Consistency

```bash
echo "=== VERSION IN PLUGIN HEADER ==="
grep -n "Version:" "$PLUGIN_DIR"/*.php 2>/dev/null | head -3

echo "=== STABLE TAG IN README ==="
grep -n "Stable tag:" "$PLUGIN_DIR/readme.txt" 2>/dev/null

echo "=== PLUGIN NAME IN HEADER ==="
grep -n "Plugin Name:" "$PLUGIN_DIR"/*.php 2>/dev/null | head -1

echo "=== PLUGIN NAME IN README ==="
head -1 "$PLUGIN_DIR/readme.txt" 2>/dev/null

echo "=== TAG COUNT ==="
grep -i "^Tags:" "$PLUGIN_DIR/readme.txt" 2>/dev/null | tr ',' '\n' | wc -l
```

### PHASE 8: Security Patterns

```bash
echo "=== DIRECT DB QUERIES WITHOUT PREPARE ==="
grep -rn 'wpdb->get_\|wpdb->query\|wpdb->delete\|wpdb->insert\|wpdb->update' --include="*.php" "$PLUGIN_DIR" | grep -v "prepare\|phpcs:ignore\|phpcs:disable"

echo "=== MISSING ABSPATH CHECK ==="
for file in $(find "$PLUGIN_DIR" -name "*.php"); do
    if ! head -20 "$file" | grep -q "ABSPATH\|WPINC"; then
        echo "Missing ABSPATH check: $file"
    fi
done
```

### PHASE 9: readme.txt Validation

```bash
echo "=== README CHECKS ==="
if [ -f "$PLUGIN_DIR/readme.txt" ]; then
    # Check for trunk stable tag
    if grep -q "Stable tag: trunk" "$PLUGIN_DIR/readme.txt"; then
        echo "ERROR: Stable tag is 'trunk' - must be version number"
    fi

    # Check tag count (max 5)
    TAG_COUNT=$(grep -i "^Tags:" "$PLUGIN_DIR/readme.txt" | tr ',' '\n' | wc -l | tr -d ' ')
    if [ "$TAG_COUNT" -gt 5 ]; then
        echo "ERROR: Too many tags ($TAG_COUNT) - maximum is 5"
    fi

    # Check for external services section
    if grep -q "wp_remote_\|file_get_contents.*http\|curl_" "$PLUGIN_DIR"/*.php "$PLUGIN_DIR"/**/*.php 2>/dev/null; then
        if ! grep -qi "External Services" "$PLUGIN_DIR/readme.txt"; then
            echo "WARNING: Plugin makes HTTP requests but no External Services section in readme"
        fi
    fi
else
    echo "ERROR: readme.txt not found"
fi
```

---

## REPORT FORMAT

After running all checks, provide a report in this format:

```
## WP.org Compliance Report for [Plugin Name]

### Summary
- Critical Issues: X
- Warnings: X
- Version Match: YES/NO

### Critical Issues (MUST FIX)
1. [file:line] Description

### Warnings
1. Description

### Recommendations
1. Description

### Verdict
[READY FOR SUBMISSION / NOT READY - X critical issues remain]
```

---

## FIX EXAMPLES

**Inline Styles:**
```php
// ❌ echo '<style>.class { color: red; }</style>';
// ✅ wp_add_inline_style('handle', '.class { color: red; }');
```

**Sanitization:**
```php
// ❌ $val = $_POST['field'];
// ✅ $val = isset($_POST['field']) ? sanitize_text_field(wp_unslash($_POST['field'])) : '';
```

**Escaping:**
```php
// ❌ echo $var;
// ✅ echo esc_html($var);
```

**ABSPATH Check:**
```php
// Add at top of every PHP file:
if (!defined('ABSPATH')) {
    exit;
}
```

---

## Reference Documentation

Full standards documentation available in the `docs/` directory:
- [01-code-requirements.md](../../docs/01-code-requirements.md)
- [02-file-structure.md](../../docs/02-file-structure.md)
- [03-readme-txt.md](../../docs/03-readme-txt.md)
- [08-common-rejections.md](../../docs/08-common-rejections.md)
