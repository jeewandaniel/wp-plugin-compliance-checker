# readme.txt Requirements

The readme.txt file is parsed by WordPress.org to display your plugin's information. It must follow a specific format.

**Validator:** https://wordpress.org/plugins/developers/readme-validator/

---

## Required Format

```
=== Plugin Name ===
Contributors: username1, username2
Tags: tag1, tag2, tag3, tag4, tag5
Requires at least: 6.0
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Short description (150 characters max).

== Description ==

Full description here. **MUST be in English** (as of July 2025).

== Installation ==

1. Upload the plugin folder to `/wp-content/plugins/`
2. Activate through the 'Plugins' menu

== Frequently Asked Questions ==

= How do I use this? =

Answer here.

== Screenshots ==

1. Caption for screenshot-1.png
2. Caption for screenshot-2.png

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release.
```

---

## Header Requirements

### Required Headers

| Header | Description | Rules |
|--------|-------------|-------|
| `Plugin Name` | Display name | Must match plugin header exactly |
| `Contributors` | WP.org usernames | Must be valid WP.org accounts |
| `Tags` | Search tags | **Maximum 5 tags** |
| `Requires at least` | Min WP version | e.g., `6.0` |
| `Tested up to` | Max tested WP | e.g., `6.5` (no minor for current major) |
| `Stable tag` | Current version | Must match plugin version exactly, **NOT "trunk"** |
| `License` | License name | e.g., `GPLv2 or later` |

### Optional Headers

| Header | Description |
|--------|-------------|
| `Requires PHP` | Minimum PHP version |
| `License URI` | URL to license text |
| `Donate link` | Valid donation URL |

---

## Critical Rules

### Plugin Name
- Must match plugin header **EXACTLY**
- Must have 5+ alphanumeric characters
- Cannot be generic ("Plugin Name", "My Basics Plugin")

### Stable Tag
- Must match plugin version **EXACTLY**
- **NEVER use "trunk"** — causes instant rejection
- Update in trunk BEFORE creating tag

### Contributors
- Must be valid WordPress.org usernames
- No trailing commas
- Case-sensitive

### Tags
- **Maximum 5 tags** (no keyword stuffing)
- No competitor names as tags
- No trademark terms
- Use relevant, descriptive tags

### Short Description
- **Maximum 150 characters**
- First line after headers
- Appears in search results

### Tested up to
- For current major version: use major only (e.g., `6.5`)
- For older versions: can include minor (e.g., `6.4.3`)
- Don't claim compatibility with unreleased versions

---

## Section Requirements

### Description (Required)
- **Must be in English** (July 2025 requirement)
- Explain what the plugin does
- No SEO spam or keyword stuffing

### External Services (Required if applicable)
If your plugin connects to any external service:

```
== External Services ==

This plugin connects to [Service Name](https://example.com) to [purpose].

**Data Sent:** [describe what data]
**When:** [when data is sent]

* [Terms of Service](https://example.com/terms)
* [Privacy Policy](https://example.com/privacy)
```

### Installation
Step-by-step installation instructions.

### Frequently Asked Questions
```
= Question here? =

Answer here.

= Another question? =

Another answer.
```

### Screenshots
One line per screenshot, numbered:
```
== Screenshots ==

1. Description of screenshot-1.png
2. Description of screenshot-2.png
```

**Screenshot files must exist in `/assets/` directory.**

### Changelog
Most recent version first:
```
== Changelog ==

= 1.1.0 =
* Added feature X
* Fixed bug Y

= 1.0.0 =
* Initial release
```

### Upgrade Notice
- **Maximum 300 characters** per version
- Appears during update prompt
```
== Upgrade Notice ==

= 1.1.0 =
Security fix. Update immediately.
```

---

## Markdown Support

Basic markdown is supported:

```
**bold**
*italic*
[link text](https://example.com)
`code`

* bullet point
* another point

1. numbered
2. list
```

---

## Validation Checklist

Before submission, verify:

- [ ] Plugin name matches header exactly
- [ ] Stable tag matches version exactly (not "trunk")
- [ ] All contributors are valid WP.org usernames
- [ ] Maximum 5 tags
- [ ] Short description ≤ 150 characters
- [ ] Description is in English
- [ ] External services documented (if any)
- [ ] Screenshot count matches screenshot lines
- [ ] No trademark terms in slug/name
- [ ] No competitor names in tags
- [ ] Passes readme validator

---

## Common Mistakes

1. **Stable tag set to "trunk"** — Always use version number
2. **Version mismatch** — readme.txt version must match plugin header
3. **Too many tags** — Maximum 5, not 10+
4. **Invalid contributors** — Must be real WP.org usernames
5. **Missing external services** — Must document any external connections
6. **Non-English description** — Must be English (translations via translate.wordpress.org)
7. **Screenshot mismatch** — Screenshot lines must match actual files
8. **Generic plugin name** — Must be unique and descriptive
9. **Affiliate links without disclosure** — Must disclose affiliate relationships
10. **Competitor tags** — Can't tag "Akismet" for an Akismet alternative

---

## Template

See [/templates/readme.txt](/templates/readme.txt) for a complete template.
