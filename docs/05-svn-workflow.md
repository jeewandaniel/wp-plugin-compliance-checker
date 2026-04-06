# SVN Workflow for WordPress.org Plugins

WordPress.org uses Subversion (SVN) for plugin hosting. This guide covers everything you need to manage your plugin.

---

## Initial Setup

### 1. Set Your SVN Password

Before your first commit, set an SVN-specific password:

1. Go to: https://profiles.wordpress.org/me/profile/edit/group/3/
2. Click "Set SVN Password" or navigate to the SVN password screen
3. Create a strong password (different from your WP.org login password)
4. Save it securely — you'll need it for every commit

> **Your SVN username is your WordPress.org username (case-sensitive)**

### 2. Checkout Your Repository

After your plugin is approved, you'll receive an SVN URL:

```bash
svn co https://plugins.svn.wordpress.org/your-plugin-slug ~/your-plugin-svn
```

This creates a local directory with the following structure:

```
your-plugin-svn/
├── trunk/      # Development/latest code
├── tags/       # Released versions
├── branches/   # (rarely used)
└── assets/     # Plugin page images (created manually)
```

---

## Directory Structure

### `/trunk/`

- Contains the latest development code
- Should always be functional and complete
- This is where you make changes before tagging releases
- **NOT necessarily the stable version** — that's determined by `Stable tag` in readme.txt

### `/tags/`

- Contains snapshots of released versions
- Each subdirectory is a version number: `/tags/1.0.0/`, `/tags/1.1.0/`
- **Never edit files directly in tags** — they're release snapshots
- Users receive code from the tag matching `Stable tag` in readme.txt

### `/assets/`

- Plugin page images (banners, icons, screenshots)
- NOT included in plugin downloads
- See [04-plugin-assets.md](04-plugin-assets.md) for details

### `/branches/`

- Rarely used for WordPress.org plugins
- Can be used for major version maintenance

---

## First Upload (After Approval)

```bash
# 1. Navigate to your checkout
cd ~/your-plugin-svn

# 2. Copy your plugin files to trunk
cp -r ~/my-plugin/* trunk/

# 3. Create assets directory and add images
mkdir -p assets
cp ~/my-assets/* assets/

# 4. Add all new files to SVN
svn add trunk/*
svn add assets/*

# 5. Set MIME types for images
svn propset svn:mime-type image/png assets/*.png
svn propset svn:mime-type image/jpeg assets/*.jpg

# 6. Commit with a descriptive message
svn ci -m "Initial release version 1.0.0"
```

If prompted for credentials:

```bash
svn ci -m "Initial release version 1.0.0" --username your_username --password your_password
```

---

## Releasing Updates

### Workflow

1. Update code in `/trunk/`
2. Update version number in main plugin file AND readme.txt
3. Commit trunk changes
4. Copy trunk to a new tag
5. Commit the new tag

### Step-by-Step

```bash
# 1. Update your local copy first
cd ~/your-plugin-svn
svn up

# 2. Copy your updated files to trunk
cp -r ~/my-plugin/* trunk/

# 3. Check what changed
svn stat
svn diff

# 4. Commit trunk changes
svn ci -m "Update to version 1.1.0 - Added feature X, fixed bug Y"

# 5. Create the version tag (copy trunk to tags)
svn cp trunk tags/1.1.0

# 6. Commit the tag
svn ci -m "Tagging version 1.1.0"
```

**CRITICAL:** Update `Stable tag` in trunk/readme.txt to match the new version BEFORE tagging.

---

## Common Commands

### Update Local Copy

Always do this before making changes:

```bash
svn up
```

### Check Status

See what files have changed:

```bash
svn stat
```

Output meanings:
- `?` — Not under version control (needs `svn add`)
- `M` — Modified
- `A` — Added
- `D` — Deleted
- `!` — Missing (deleted without `svn rm`)

### View Changes

```bash
# All changes
svn diff

# Specific file
svn diff trunk/my-plugin.php
```

### Add New Files

```bash
# Single file
svn add trunk/new-file.php

# All unversioned files in trunk
svn add trunk/*

# Recursively add directory
svn add trunk/includes/
```

### Remove Files

```bash
svn rm trunk/old-file.php
```

### Revert Changes

```bash
# Single file
svn revert trunk/file.php

# All changes
svn revert -R .
```

---

## Best Practices

### DO:

- **Keep trunk current** — Always maintain the latest code in trunk
- **Use descriptive commit messages** — "Fixed SQL injection in search function" not "update"
- **Tag every release** — Users only get updates when version changes
- **Test before committing** — SVN is for releases, not development
- **Update `Stable tag` first** — Before creating a tag, update readme.txt in trunk

### DON'T:

- **Don't commit frequently** — SVN is a release system, not development. Push only finished changes.
- **Don't edit tags directly** — Tags are snapshots. Make changes in trunk, then create new tag.
- **Don't upload zip files** — SVN handles individual files
- **Don't include development files** — No `.git/`, `node_modules/`, `composer.lock` (dev), etc.
- **Don't use SVN for development** — Use Git locally, SVN only for releases

---

## Updating readme.txt Only

To update "Tested up to" without a full release:

```bash
cd ~/your-plugin-svn
svn up
# Edit trunk/readme.txt - update "Tested up to: 6.5"
svn ci -m "Tested up to WordPress 6.5"
```

No need to create a new tag for readme-only changes.

---

## Performance Notes

> Every time you push code to SVN, it rebuilds ALL your zip files for all versions. This is why sometimes your plugin updates don't show for up to **6 hours**.

- Large commits take longer to process
- Multiple rapid commits strain the system
- Be patient after committing — changes may not appear immediately

---

## Troubleshooting

### "Access Denied" Error

- Verify username is exact (case-sensitive)
- Reset SVN password at profiles.wordpress.org
- Try with explicit credentials: `--username your_username --password your_password`

### Files Not Appearing

- Wait up to 6 hours for CDN cache
- Verify `Stable tag` in trunk/readme.txt matches your tag
- Check that tag directory exists and contains files

### "Commit Failed" Error

- Run `svn up` first to get latest changes
- Check for conflicts: `svn stat`
- Resolve conflicts before committing

### Missing Files in Download

- Ensure files are committed (not just locally present)
- Check that `Stable tag` points to correct version
- Verify tag contains all files: `svn ls tags/1.0.0/`

---

## Quick Reference

```bash
# Setup
svn co https://plugins.svn.wordpress.org/SLUG ~/svn-SLUG

# Before any work
svn up

# Check status
svn stat
svn diff

# Add/remove files
svn add filename
svn rm filename

# Commit changes
svn ci -m "Description of changes"

# Create release tag
svn cp trunk tags/X.Y.Z
svn ci -m "Tagging version X.Y.Z"

# View repository contents
svn ls https://plugins.svn.wordpress.org/SLUG/trunk/
svn ls https://plugins.svn.wordpress.org/SLUG/tags/
```
