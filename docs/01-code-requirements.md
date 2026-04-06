# Code Requirements (Security & Standards)

These are the code-level requirements that cause instant rejection if violated.

---

## 1. Script & Style Enqueueing (CRITICAL)

**NEVER use inline `<style>` or `<script>` tags in PHP files.**

This is the #1 rejection reason. Plugin Check specifically scans for `<style` and `<script` tags.

```php
// ❌ WRONG - INSTANT REJECTION
function my_admin_page() {
    ?>
    <style>.my-class { color: red; }</style>
    <script>alert('hello');</script>
    <?php
}

// ❌ WRONG - Even in conditionals
if ($condition) {
    echo '<style>.class { display: none; }</style>';
}

// ✅ CORRECT - External file + enqueue
function my_enqueue_assets($hook) {
    wp_enqueue_style('my-plugin-admin', plugins_url('css/admin.css', __FILE__), array(), '1.0.0');
    wp_enqueue_script('my-plugin-admin', plugins_url('js/admin.js', __FILE__), array('jquery'), '1.0.0', true);
}
add_action('admin_enqueue_scripts', 'my_enqueue_assets');

// ✅ CORRECT - Dynamic inline CSS/JS via proper functions
wp_add_inline_style('my-plugin-admin', '.dynamic-class { color: ' . esc_attr($color) . '; }');
wp_add_inline_script('my-plugin-admin', 'var myConfig = ' . wp_json_encode($config) . ';', 'before');
```

### Enqueueing Hooks

| Hook | Use For |
|------|---------|
| `wp_enqueue_scripts` | Frontend |
| `admin_enqueue_scripts` | Admin pages (receives `$hook` parameter) |
| `login_enqueue_scripts` | Login page |

---

## 2. Input Sanitization (CRITICAL)

**ALL `$_POST`, `$_GET`, `$_REQUEST`, `$_SERVER`, `$_FILES` must be sanitized.**

```php
// ❌ WRONG
$name = $_POST['name'];
$id = $_GET['id'];

// ✅ CORRECT - Always sanitize AND unslash
$name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
$id = isset($_GET['id']) ? absint($_GET['id']) : 0;
$email = isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
$url = isset($_POST['url']) ? esc_url_raw(wp_unslash($_POST['url'])) : '';
$content = isset($_POST['content']) ? wp_kses_post(wp_unslash($_POST['content'])) : '';
```

### Sanitization Function Reference

| Data Type | Function |
|-----------|----------|
| Single-line text | `sanitize_text_field()` |
| Multi-line text | `sanitize_textarea_field()` |
| Email | `sanitize_email()` |
| URL (for storage) | `esc_url_raw()` |
| Integer (positive) | `absint()` |
| Integer (any) | `intval()` or `(int)` |
| Filename | `sanitize_file_name()` |
| HTML class | `sanitize_html_class()` |
| Key/slug | `sanitize_key()` |
| Hex color | `sanitize_hex_color()` |
| HTML content | `wp_kses_post()` |
| Custom HTML | `wp_kses($input, $allowed_html)` |

### Critical Rules

1. Always use `wp_unslash()` BEFORE sanitizing superglobals
2. Sanitize ≠ Escape — they serve different purposes
3. Do NOT use escape functions for sanitization
4. **Sanitize on INPUT, escape on OUTPUT**

---

## 3. Output Escaping (CRITICAL)

**ALL output must be escaped using context-appropriate functions.**

```php
// ❌ WRONG
echo $variable;
echo __('Text', 'my-plugin');  // Translation without escaping

// ✅ CORRECT
echo esc_html($variable);
echo esc_html__('Text', 'my-plugin');
```

### Escaping Function Reference

| Context | Function |
|---------|----------|
| HTML content | `esc_html()` |
| HTML attribute | `esc_attr()` |
| URL (href, src) | `esc_url()` |
| JavaScript | `esc_js()` |
| Textarea content | `esc_textarea()` |

### Translation + Escaping Combos

| Function | Usage |
|----------|-------|
| `esc_html__()` | Return escaped translation |
| `esc_html_e()` | Echo escaped translation |
| `esc_attr__()` | Return escaped translation for attribute |
| `esc_attr_e()` | Echo escaped translation for attribute |

---

## 4. Nonce Verification (CRITICAL)

**ALL form submissions and AJAX handlers must verify nonces.**

```php
// Creating nonce in form
wp_nonce_field('my_action', 'my_nonce');

// ❌ WRONG - Nonce not sanitized
if (!wp_verify_nonce($_POST['my_nonce'], 'my_action')) { ... }

// ✅ CORRECT - Sanitize nonce input first
if (!isset($_POST['my_nonce']) ||
    !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['my_nonce'])), 'my_action')) {
    wp_die(__('Security check failed', 'my-plugin'));
}

// AJAX - use check_ajax_referer
check_ajax_referer('my_ajax_action', 'nonce');
```

---

## 5. Capability Checks (CRITICAL)

**ALL admin functions must check capabilities BEFORE processing.**

```php
// ❌ WRONG - No capability check
function my_save_settings() {
    update_option('my_option', $_POST['value']);
}

// ✅ CORRECT - Capability check FIRST
function my_save_settings() {
    if (!current_user_can('manage_options')) {
        wp_die(__('Unauthorized', 'my-plugin'));
    }
    // Then verify nonce, then sanitize, then process
}
```

---

## 6. SQL Injection Prevention (CRITICAL)

**ALL database queries must use `$wpdb->prepare()` or helper methods.**

```php
// ❌ WRONG
$wpdb->get_results("SELECT * FROM $table WHERE id = $id");
$wpdb->query("DELETE FROM table WHERE id=$id");

// ✅ CORRECT
$wpdb->get_results($wpdb->prepare(
    "SELECT * FROM {$wpdb->prefix}my_table WHERE id = %d",
    $id
));

// For custom tables, add phpcs comments
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
$results = $wpdb->get_results($wpdb->prepare(...));
// phpcs:enable
```

### Placeholders

- `%d` — Integer
- `%s` — String
- `%f` — Float

---

## 7. Direct File Access Prevention

**EVERY PHP file must have this at the top (first code after `<?php`):**

```php
<?php
if (!defined('ABSPATH')) {
    exit;
}
```

Alternative patterns also accepted:
```php
defined('ABSPATH') || exit;
defined('WPINC') || die;
```

---

## 8. Function/Class Naming (CRITICAL)

**Rules:**
- Use unique **4+ character prefix** (e.g., `sant_`, `myplugin_`)
- **NO leading underscores** on function names (except `__construct`)
- 2-3 letter prefixes are TOO SHORT
- Do NOT use reserved prefixes: `wp_`, `__`, or single `_`

```php
// ❌ WRONG
function _my_helper() {}        // Leading underscore
function get_settings() {}      // No prefix, too generic
function wp_my_function() {}    // Reserved prefix
function ab_function() {}       // Too short

// ✅ CORRECT
function sant_get_settings() {}
function sant_chat_ai_helper() {}
class Sant_Chat_AI_Admin {}
```

---

## 9. Forbidden Functions and Patterns

**These will cause rejection:**

```php
// File operations
move_uploaded_file()  // Use wp_handle_upload() instead

// Dangerous functions
eval()
create_function()
passthru()
proc_open()
str_rot13()  // Code obfuscation indicator

// Configuration
ini_set('memory_limit', '-1')  // Don't set globally
error_reporting()  // Don't use in production
set_time_limit()  // Discouraged

// Upload security
define('ALLOW_UNFILTERED_UPLOADS', true)  // NEVER do this
```

---

## 10. WordPress Default Libraries

**NEVER bundle these — use WordPress versions:**
- jQuery / jQuery UI
- Backbone.js / Underscore.js
- React
- Moment.js
- Lodash
- PHPMailer, PHPass, SimplePie

---

## 11. PHP Standards

```php
// ❌ WRONG
<?  // Short open tag
<?= $var ?>  // Short echo tag

// ✅ CORRECT
<?php
echo esc_html($var);
```

**DO NOT USE:**
- HEREDOC syntax (prevents escaping detection)
- NOWDOC syntax (allowed but discouraged)
- PHP short tags

---

## PHPCS Suppression Comments

When you have legitimate code that triggers warnings:

```php
// Direct database query on custom table
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
$results = $wpdb->get_results(...);
// phpcs:enable

// Public REST API endpoint (no nonce expected)
// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Public REST API endpoint
$data = sanitize_text_field(wp_unslash($_POST['data']));

// OAuth callback (no nonce expected from external service)
// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- OAuth callback
$code = sanitize_text_field(wp_unslash($_GET['code']));

// Debug logging wrapped in WP_DEBUG
// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug mode only
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('Debug: ' . $message);
}
```
