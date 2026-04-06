# Common Rejection Reasons (Ranked)

Based on WordPress.org review data and Plugin Check detection patterns.

---

## Statistics

- **~1% first-pass approval rate** (historically)
- **69.5% overall approval rate** (2025)
- **Average: 3 interactions** per plugin before approval
- **Plugin Check integration (Sep 2024)** reduced issues by 41%
- **85% of initial reviews** now AI-automated

---

## Top 20 Rejection Reasons

### 1. Inline `<style>` or `<script>` Tags

**The #1 rejection reason.** Plugin Check specifically scans for these.

```php
// ❌ REJECTED
echo '<style>.my-class { color: red; }</style>';
echo '<script>alert("hi");</script>';

// ✅ CORRECT
wp_enqueue_style('my-handle', plugins_url('css/style.css', __FILE__));
wp_add_inline_style('my-handle', '.my-class { color: red; }');
```

### 2. Missing Sanitization

All `$_POST`, `$_GET`, `$_REQUEST`, `$_SERVER` must be sanitized.

```php
// ❌ REJECTED
$name = $_POST['name'];

// ✅ CORRECT
$name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
```

### 3. Missing Escaping

All output must be escaped.

```php
// ❌ REJECTED
echo $variable;

// ✅ CORRECT
echo esc_html($variable);
```

### 4. Missing Nonces

All form submissions and AJAX handlers need nonce verification.

```php
// ❌ REJECTED
function save_data() {
    update_option('key', $_POST['value']);
}

// ✅ CORRECT
function save_data() {
    if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'my_action')) {
        wp_die('Security check failed');
    }
    // ... process
}
```

### 5. Missing Capability Checks

Admin functions must verify user capabilities.

```php
// ❌ REJECTED
function delete_data() {
    $wpdb->delete('table', ['id' => $_GET['id']]);
}

// ✅ CORRECT
function delete_data() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    // ... process
}
```

### 6. Generic Function Names

Must use unique 4+ character prefix.

```php
// ❌ REJECTED
function get_settings() {}
function _helper() {}

// ✅ CORRECT
function myplugin_get_settings() {}
```

### 7. Leading Underscore Functions

No leading underscores (except `__construct`).

```php
// ❌ REJECTED
function _my_function() {}

// ✅ CORRECT
function myplugin_my_function() {}
```

### 8. Bundled WordPress Libraries

Don't include jQuery, React, Moment.js, etc.

```php
// ❌ REJECTED
wp_enqueue_script('my-jquery', plugins_url('js/jquery.min.js', __FILE__));

// ✅ CORRECT
wp_enqueue_script('my-script', plugins_url('js/script.js', __FILE__), array('jquery'));
```

### 9. readme.txt Version Mismatch

`Stable tag` must match plugin version exactly.

```
// ❌ REJECTED
Plugin header: Version: 1.0.1
readme.txt: Stable tag: 1.0.0

// ✅ CORRECT
Both: 1.0.1
```

### 10. Stable Tag Set to "trunk"

Never use "trunk" as stable tag.

```
// ❌ REJECTED
Stable tag: trunk

// ✅ CORRECT
Stable tag: 1.0.0
```

### 11. Undisclosed External Services

Must document all external connections in readme.txt.

```
// ❌ REJECTED
Plugin calls api.example.com with no documentation

// ✅ CORRECT
== External Services ==
This plugin connects to [Example API](https://api.example.com) for...
* [Terms of Service](https://example.com/terms)
* [Privacy Policy](https://example.com/privacy)
```

### 12. Trialware / Paywalled Features

Cannot disable features after trial or require payment for functionality.

### 13. Custom Update Checker

Cannot serve updates from non-WP.org servers.

```php
// ❌ REJECTED
require 'plugin-update-checker/plugin-update-checker.php';
$updateChecker = Puc_v4_Factory::buildUpdateChecker(
    'https://example.com/updates',
    __FILE__
);
```

### 14. Forbidden Files

No `.sh`, `.phar`, `.exe`, `node_modules/`, `.git/`.

### 15. Trademark Violations

Slug cannot start with trademarked terms.

```
// ❌ REJECTED
wordpress-my-plugin
woocommerce-addon
chatgpt-helper

// ✅ CORRECT
my-plugin-for-woocommerce
ai-helper-for-wordpress
```

### 16. HEREDOC/NOWDOC Usage

Prevents proper escaping detection.

```php
// ❌ REJECTED
$html = <<<HTML
<div>$variable</div>
HTML;

// ✅ CORRECT
$html = '<div>' . esc_html($variable) . '</div>';
```

### 17. Localhost References

Remove development URLs.

```php
// ❌ REJECTED
$api_url = 'http://localhost:8080/api';
$dev_url = 'http://127.0.0.1/test';

// ✅ CORRECT
$api_url = 'https://api.example.com';
```

### 18. Missing ABSPATH Check

Every PHP file needs direct access prevention.

```php
// ❌ REJECTED
<?php
class My_Class {
    // ...
}

// ✅ CORRECT
<?php
if (!defined('ABSPATH')) {
    exit;
}

class My_Class {
    // ...
}
```

### 19. Invalid Plugin Name

Must have 5+ alphanumeric chars, not generic.

```
// ❌ REJECTED
Plugin Name: Test
Plugin Name: Plugin Name
Plugin Name: My Basics Plugin

// ✅ CORRECT
Plugin Name: My Awesome Feature Plugin
```

### 20. Non-English readme.txt

Description must be in English (July 2025 requirement).

---

## Quick Fix Reference

| Issue | Fix |
|-------|-----|
| Inline `<style>` | `wp_enqueue_style()` + `wp_add_inline_style()` |
| Inline `<script>` | `wp_enqueue_script()` + `wp_add_inline_script()` |
| Missing sanitization | `sanitize_text_field(wp_unslash($_POST['x']))` |
| Missing escaping | `esc_html()`, `esc_attr()`, `esc_url()` |
| Missing nonce | `wp_nonce_field()` + `wp_verify_nonce()` |
| Missing capability | `current_user_can('manage_options')` |
| Generic function | Add 4+ char prefix |
| Leading underscore | Remove underscore |
| Bundled library | Use WP-bundled version |
| Version mismatch | Match in both files |
| Stable tag trunk | Use version number |
| No ABSPATH check | Add `defined('ABSPATH') \|\| exit;` |
