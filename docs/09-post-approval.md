# Post-Approval: Updates & Maintenance

What to do after your plugin is approved on WordPress.org.

---

## First Steps After Approval

### 1. Set Your SVN Password

If you haven't already:
1. Go to: https://profiles.wordpress.org/me/profile/edit/group/3/
2. Set an SVN-specific password
3. Save it securely

### 2. Checkout Your Repository

```bash
svn co https://plugins.svn.wordpress.org/your-plugin-slug ~/your-plugin-svn
```

### 3. Upload Assets

Add banners, icons, and screenshots:

```bash
cd ~/your-plugin-svn
mkdir -p assets

# Copy your assets
cp ~/my-assets/banner-772x250.png assets/
cp ~/my-assets/icon-128x128.png assets/

# Add to SVN
svn add assets/*

# Set MIME types
svn propset svn:mime-type image/png assets/*.png

# Commit
svn ci -m "Add plugin assets"
```

---

## Releasing Updates

### Update Workflow

1. **Develop locally** (use Git for development)
2. **Test thoroughly**
3. **Run Plugin Check** — new checks are added regularly
4. **Update version numbers** (both files)
5. **Update changelog** in readme.txt
6. **Commit to trunk**
7. **Create version tag**

### Step-by-Step

```bash
# 1. Update local SVN
cd ~/your-plugin-svn
svn up

# 2. Copy new plugin files
cp -r ~/my-plugin/* trunk/

# 3. Update version in trunk/readme.txt:
#    - Stable tag: X.Y.Z
#    - Changelog entry

# 4. Commit trunk
svn ci -m "Update to version 1.1.0 - Feature X, bugfix Y"

# 5. Create tag
svn cp trunk tags/1.1.0
svn ci -m "Tagging version 1.1.0"
```

### Version Numbering

Follow semantic versioning:
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

---

## Updating "Tested up to" Only

When a new WordPress version releases, update compatibility:

```bash
svn up
# Edit trunk/readme.txt - change "Tested up to: 6.6"
svn ci -m "Tested up to WordPress 6.6"
```

No new tag needed for readme-only changes.

---

## Staged/Phased Releases

WordPress.org rollout controls may evolve over time. If phased or delayed rollout options are available to your plugin or account, treat them as release-management tools rather than a substitute for testing.

### Delay Auto-updates

If delayed auto-update controls are available, they can help you:
- Monitor for issues
- Roll back if problems are found
- Test with early adopters first

### Availability

Check current WordPress.org plugin developer documentation or your plugin management screens for the latest rollout controls available to your plugin.

---

## Plugin Statistics

After approval, you can view:
- Active installations
- Download counts
- Growth rate
- WordPress version distribution
- PHP version distribution

Access at: `https://wordpress.org/plugins/your-plugin-slug/advanced/`

---

## Support Channels

### Support Forum

Each plugin gets a support forum:
`https://wordpress.org/support/plugin/your-plugin-slug/`

**Best practices:**
- Respond within 7 days
- Mark resolved threads as resolved
- Be professional and helpful
- Don't spam users with upsells

### Review Management

Users can leave reviews. You can:
- Respond to reviews
- Report abusive reviews
- NOT remove legitimate negative reviews

---

## Common Post-Approval Issues

### "My update isn't showing"

- Wait up to 6 hours — CDN caching
- Verify `Stable tag` in trunk/readme.txt matches your tag
- Check that tag exists: `svn ls https://plugins.svn.wordpress.org/your-plugin/tags/`

### "Assets not displaying"

- Check assets directory: `svn ls https://plugins.svn.wordpress.org/your-plugin/assets/`
- Verify MIME types are set
- Wait for CDN cache (up to 24 hours for images)

### "Plugin was closed"

Common reasons:
- Security vulnerability reported
- Guideline violation discovered
- Inactive/abandoned (no updates for 2+ years)
- Author request

To reopen: Contact plugins@wordpress.org with fixes

---

## Security Vulnerabilities

If a vulnerability is reported:

1. **Respond immediately** — Plugin may be closed
2. **Fix the issue** — Don't delay
3. **Release patched version** — Increment version number
4. **Notify the reporter** — Confirm fix
5. **Consider disclosure** — After patch is released

### If Your Plugin is Closed

1. You'll receive an email explaining why
2. Fix all issues mentioned
3. Reply to the email with your fixes
4. Wait for review (can take 1-2 weeks)

---

## Plugin Removal

### Voluntary Removal

If you want to remove your plugin:
1. Email plugins@wordpress.org
2. Explain why
3. Plugin will be closed (not deleted)

### Forced Removal

Plugins can be removed for:
- Security issues (temporary until fixed)
- Guideline violations
- Legal issues (DMCA, trademark)
- Abandonment

---

## Best Practices

### Development

- Use Git locally, SVN for releases only
- Run Plugin Check before every release
- Test on latest WordPress beta
- Support PHP 7.4+ minimum

### Communication

- Respond to support requests promptly
- Keep changelog up to date
- Announce major updates
- Be transparent about changes

### Maintenance

- Update "Tested up to" when new WP releases
- Fix security issues immediately
- Remove deprecated function calls
- Keep dependencies updated

---

## Automation Ideas

### GitHub to SVN Sync

You can automate SVN deployment from GitHub:

1. Use GitHub Actions to trigger on release
2. Checkout SVN repo
3. Copy files from Git to SVN trunk
4. Create tag
5. Commit

### Example Workflow (conceptual)

```yaml
name: Deploy to WordPress.org

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to WordPress.org
        uses: 10up/action-wordpress-plugin-deploy@stable
        env:
          SVN_USERNAME: ${{ secrets.SVN_USERNAME }}
          SVN_PASSWORD: ${{ secrets.SVN_PASSWORD }}
```

---

## Important Timing Notes

| Action | Wait Time |
|--------|-----------|
| CDN cache update (plugin files) | Up to 6 hours |
| **Search results update** | **Often 6 to 14 days** |
| Asset images (banners/icons) | Up to 24 hours |

> After your first upload, your plugin may not appear in WordPress.org search results immediately. Current WordPress.org FAQ guidance indicates search indexing commonly takes 6 to 14 days.

---

## Resources

**Official WordPress.org Links:**
- [Plugin Directory](https://wordpress.org/plugins/)
- [Plugin Developer FAQ](https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/)
- [Developer Blog](https://make.wordpress.org/plugins/)
- [Plugin Review Process](https://developer.wordpress.org/plugins/wordpress-org/plugin-review-process/)
- [Security Best Practices](https://developer.wordpress.org/apis/security/)
- [Block-Specific Plugin Guidelines](https://developer.wordpress.org/plugins/wordpress-org/block-specific-plugin-guidelines/)

**Tools:**
- [Readme.txt Validator](https://wordpress.org/plugins/developers/readme-validator/)
- [Plugin Check Tool](https://wordpress.org/plugins/plugin-check/)
- [SVN Password Setup](https://make.wordpress.org/meta/handbook/tutorials-guides/svn-access/)
