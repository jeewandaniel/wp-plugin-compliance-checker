# Plugin Assets (Banners, Icons, Screenshots)

Plugin assets are stored in the `/assets/` directory of your SVN repository (NOT in `/trunk/`).

> All images are served through a CDN and cached heavily. It may take some time to update when changed or added.

---

## Directory Location

```
your-plugin/
├── assets/           ← Plugin assets go here
│   ├── banner-772x250.png
│   ├── banner-1544x500.png
│   ├── icon-128x128.png
│   ├── icon-256x256.png
│   ├── icon.svg
│   ├── screenshot-1.png
│   └── screenshot-2.png
├── trunk/            ← Plugin code goes here
│   └── ...
└── tags/
    └── 1.0.0/
```

**CRITICAL:** Assets are NOT included in plugin downloads. They're only used for the WordPress.org plugin page display.

---

## Plugin Banners (Headers)

The large image displayed at the top of your plugin page.

### Sizes

| Type | Filename | Dimensions | Max Size |
|------|----------|------------|----------|
| Standard | `banner-772x250.png` or `.jpg` | 772 × 250 px | 4 MB |
| Retina/Hi-DPI | `banner-1544x500.png` or `.jpg` | 1544 × 500 px | 4 MB |

### Localization

For RTL languages (Hebrew, Arabic) or specific locales:

```
banner-772x250-rtl.png          # RTL version
banner-772x250-es.png           # Spanish
banner-772x250-es_ES.png        # Spanish (Spain)
banner-1544x500-rtl.png         # Retina RTL
banner-1544x500-de_DE.png       # Retina German
```

### Notes

- Plugin banners are optional, but if you provide a retina banner you should also provide the standard banner
- Keep important content away from edges (may be cropped on mobile)
- Avoid text-heavy banners (won't scale well)
- JPG for photos, PNG for graphics/text

---

## Plugin Icons

The square icon shown in search results and plugin listings.

### Sizes

| Type | Filename | Dimensions | Max Size |
|------|----------|------------|----------|
| Standard | `icon-128x128.png` or `.jpg` or `.gif` | 128 × 128 px | 1 MB |
| Retina/Hi-DPI | `icon-256x256.png` or `.jpg` or `.gif` | 256 × 256 px | 1 MB |
| Vector | `icon.svg` | Any (vector) | 1 MB |

### Notes

- Plugin icons are optional, but strongly recommended
- If no icon is provided, WordPress generates a default colored icon
- SVG icons supported, but PNG fallback recommended for older browsers
- GIF supported but NOT animated GIFs
- Keep it simple — icons are displayed very small

### Tips

- Use a simple, recognizable symbol
- Ensure it works at 128px (very small)
- Match your branding/logo
- Avoid detailed imagery that won't be visible at small sizes

---

## Screenshots

Screenshots appear in the "Screenshots" tab on your plugin page.

### Naming Convention

```
screenshot-1.png    # First screenshot
screenshot-2.png    # Second screenshot
screenshot-3.jpg    # Third screenshot
...
screenshot-10.png   # Tenth screenshot
```

**Rules:**
- Filenames must be **lowercase only**
- Numbered sequentially starting from 1
- One screenshot per line in `readme.txt`

### Localization

```
screenshot-1-de.png     # German version of screenshot 1
screenshot-2-fr_FR.png  # French (France) version of screenshot 2
```

### Requirements

| Attribute | Limit |
|-----------|-------|
| Max file size | 10 MB per image |
| Format | PNG or JPG |
| External links | NOT supported (must be local files) |

### Captions

Captions come from your `readme.txt` file:

```
== Screenshots ==

1. This is the caption for screenshot-1.png
2. This is the caption for screenshot-2.png
3. This is the caption for screenshot-3.png
```

**There must be one screenshot file for every line in your readme.txt screenshots section.**

---

## SVN MIME Types

To prevent browsers from downloading images instead of displaying them, set MIME types:

### Per-File

```bash
svn propset svn:mime-type image/png assets/*.png
svn propset svn:mime-type image/jpeg assets/*.jpg
svn propset svn:mime-type image/gif assets/*.gif
svn propset svn:mime-type image/svg+xml assets/*.svg
```

### Permanent Configuration

Add to `~/.subversion/config`:

```ini
[auto-props]
*.png = svn:mime-type=image/png
*.jpg = svn:mime-type=image/jpeg
*.jpeg = svn:mime-type=image/jpeg
*.gif = svn:mime-type=image/gif
*.svg = svn:mime-type=image/svg+xml
```

---

## Complete SVN Workflow for Assets

```bash
# 1. Navigate to your local SVN checkout
cd ~/my-plugin-svn

# 2. Add asset files
cp ~/my-assets/* assets/

# 3. Register new files with SVN
svn add assets/*

# 4. Set MIME types
svn propset svn:mime-type image/png assets/*.png
svn propset svn:mime-type image/jpeg assets/*.jpg

# 5. Commit
svn ci -m "Add plugin assets (banner, icon, screenshots)"
```

---

## Asset Checklist

Before submission, verify:

- [ ] Optional banner assets are correctly sized if included
- [ ] Optional icon assets are correctly sized if included
- [ ] Screenshots numbered correctly (1, 2, 3...)
- [ ] Screenshot count matches readme.txt lines
- [ ] All filenames are lowercase
- [ ] All files under size limits
- [ ] MIME types set correctly

---

## Common Mistakes

1. **Putting assets in `/trunk/`** — Assets go in `/assets/` at the repo root
2. **Wrong dimensions** — Banner must be exactly 772×250 or 1544×500
3. **Missing standard size** — Retina images require standard versions too
4. **Screenshot mismatch** — Number of screenshots must match readme.txt lines
5. **Uppercase filenames** — All asset filenames must be lowercase
6. **Forgetting MIME types** — Images may not display without proper MIME types
