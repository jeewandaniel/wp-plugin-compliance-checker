# File Structure Requirements

This guide covers the required file structure and forbidden files for WordPress.org plugins.

---

## Recommended Directory Structure

```
/plugin-name/
├── plugin-name.php          # Main file (MUST match folder name)
├── uninstall.php            # Cleanup on delete
├── readme.txt               # REQUIRED
├── /includes/               # PHP classes
│   ├── class-admin.php
│   └── class-public.php
├── /admin/
│   ├── /css/
│   ├── /js/
│   └── /images/
├── /public/
│   ├── /css/
│   ├── /js/
│   └── /views/
└── /languages/
    └── plugin-name.pot
```

---

## Required Files

### Main Plugin File

The main plugin file MUST match the folder name:
- Folder: `my-plugin/`
- Main file: `my-plugin/my-plugin.php`

**Never place the main file in a subfolder:**
```
❌ my-plugin/my-plugin/my-plugin.php  # WRONG
✅ my-plugin/my-plugin.php             # CORRECT
```

### readme.txt

Required for all plugins. See [03-readme-txt.md](03-readme-txt.md).

### uninstall.php

Should clean up all plugin data when the plugin is deleted.

```php
<?php
// MUST check this constant
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Clean up options
delete_option('my_plugin_options');
delete_option('my_plugin_version');

// Clean up transients
delete_transient('my_plugin_cache');

// Clean up custom tables
global $wpdb;
$wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}my_plugin_table");

// Clean up user meta
delete_metadata('user', 0, 'my_plugin_user_meta', '', true);

// Clean up post meta
delete_metadata('post', 0, 'my_plugin_post_meta', '', true);
```

---

## Forbidden Files (Plugin Check Detects These)

### Forbidden File Types

| Extension | Reason |
|-----------|--------|
| `.sh` | Shell scripts |
| `.exe`, `.bin`, `.so` | Executables |
| `.phar` | PHP archives |
| `.zip`, `.gz`, `.tar`, `.rar`, `.7z` | Compressed files |
| `.bak`, `.swp` | Backup/swap files |

### Forbidden Directories

| Directory | Reason |
|-----------|--------|
| `node_modules/` | Development dependencies |
| `vendor/` (with dev deps) | Composer dev dependencies |
| `/tests/`, `/phpunit/` | Test files |
| `.git/`, `.svn/` | Version control |
| `.idea/`, `.vscode/` | IDE configuration |

### AI Instruction Directories (NEW - Plugin Check 1.8+)

| Directory/File | Reason |
|----------------|--------|
| `.cursor/` | Cursor AI |
| `.claude/` | Claude AI |
| `.aider/` | Aider AI |
| `.continue/` | Continue AI |
| `.windsurf/` | Windsurf AI |
| `.ai/` | Generic AI |
| `CLAUDE.md` | Claude instructions |
| `AGENTS.md` | AI agents |
| `.cursorrules` | Cursor rules |

### Development Files to Exclude

| File | Reason |
|------|--------|
| `.babelrc` | Build config |
| `webpack.config.js` | Build config |
| `package.json` | Node config |
| `package-lock.json` | Node lock file |
| `composer.json` | Composer config (optional to include) |
| `composer.lock` | Composer lock file |
| `phpunit.xml` | Test config |
| `Gruntfile.js` | Build config |
| `gulpfile.js` | Build config |
| `Makefile` | Build config |

---

## Plugin Header Requirements

The main plugin file must have a valid header:

```php
<?php
/**
 * Plugin Name:       My Plugin Name
 * Plugin URI:        https://example.com/my-plugin
 * Description:       Brief description of what the plugin does.
 * Version:           1.0.0
 * Author:            Author Name
 * Author URI:        https://example.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       my-plugin-slug
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
```

### Header Rules

| Header | Rule |
|--------|------|
| Plugin Name | Must have 5+ alphanumeric chars, not generic |
| Plugin URI | Must be valid URL, not placeholder |
| Description | Cannot be default text |
| Version | Must match readme.txt Stable tag |
| Author URI | Omit if same as Plugin URI |
| Text Domain | MUST match plugin slug |
| Domain Path | MUST start with `/` |

### Invalid Plugin Names

- "Plugin Name"
- "My Basics Plugin"
- Names with fewer than 5 alphanumeric characters

### Invalid Descriptions

- "This is a short description of what the plugin does"
- "Here is a short description of the plugin"
- "Handle the basics with this plugin"

---

## Build Process Considerations

### What to Include in Release

```
my-plugin/
├── my-plugin.php        ✅
├── readme.txt           ✅
├── uninstall.php        ✅
├── includes/            ✅
├── admin/               ✅
├── public/              ✅
├── languages/           ✅
├── vendor/ (autoload)   ✅ (production only)
└── assets/ (images)     ✅
```

### What to Exclude from Release

```
.git/                    ❌
.github/                 ❌
node_modules/            ❌
vendor/ (dev deps)       ❌
tests/                   ❌
.cursor/                 ❌
.claude/                 ❌
CLAUDE.md                ❌
package.json             ❌
composer.json            ❌ (optional)
composer.lock            ❌
webpack.config.js        ❌
*.sh                     ❌
```

### Example .distignore

For build tools that support it:

```
.git
.github
.cursor
.claude
node_modules
tests
*.sh
*.md
!readme.txt
package.json
package-lock.json
composer.json
composer.lock
webpack.config.js
.babelrc
phpunit.xml
CLAUDE.md
AGENTS.md
.cursorrules
```

---

## Verification Commands

```bash
# Find forbidden files
find . -name "*.sh" -o -name "*.phar" -o -name "*.exe" -o -name "*.zip" 2>/dev/null

# Find forbidden directories
find . -type d \( -name "node_modules" -o -name ".git" -o -name ".svn" -o -name ".cursor" -o -name ".claude" \) 2>/dev/null

# Find AI instruction files
find . \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".cursorrules" \) 2>/dev/null

# Check plugin header
grep -n "Plugin Name:\|Version:\|Text Domain:" *.php
```
