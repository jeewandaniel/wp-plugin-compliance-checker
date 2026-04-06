# WordPress.org Official Plugin Guidelines

These are the 18 official guidelines from WordPress.org. Violating any of these can result in plugin rejection or removal.

**Source:** https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/

---

## Guideline 1: Plugins must be compatible with the GNU General Public License

- All code, data, and images must comply with GPL or GPL-compatible licenses
- **"GPLv2 or later"** is strongly recommended
- Third-party libraries must be GPL-compatible
- You must validate licensing of all included files before uploading

**Common GPL-compatible licenses:**
- MIT, BSD, Apache 2.0, ISC, MPL-2.0, WTFPL, The Unlicense

---

## Guideline 2: Developers are responsible for the contents and actions of their plugins

- You ensure all files comply with guidelines
- Prohibited: intentionally circumventing rules or restoring removed code
- Must validate licensing of all included files
- Security is your ultimate responsibility

---

## Guideline 3: A stable version of a plugin must be available from its WordPress Plugin Directory page

- One version distributed through WordPress.org directory
- Keeping alternate development locations updated while neglecting the directory version risks removal
- The directory is meant to be the canonical source

---

## Guideline 4: Code must be (mostly) human readable

**Prohibited:**
- Packers, minifiers with unclear naming
- Zend Guard, ionCube, Source Guardian encoding
- Base64-encoded executable code

**Required:**
- Source code must be included in deployed plugin OR
- Link to development location with readable source
- Build tools must be documented

---

## Guideline 5: Trialware is not permitted

**Prohibited:**
- Functionality restricted or locked behind payment
- Disabled features after trial periods
- Sandbox-only API access that expires

**Allowed:**
- Paid external services
- All plugin code must be fully available and functional

---

## Guideline 6: Software as a Service is permitted

**Allowed:**
- External third-party service interfaces (including paid services)
- Service must provide "substance" and be clearly documented

**Prohibited:**
- Services that only validate licenses
- Moving code artificially to external servers
- Storefronts without actual service functionality

**Required:**
- Document service with Terms of Use link in readme.txt

---

## Guideline 7: Plugins may not track users without their consent

**Prohibited:**
- Contacting external servers without explicit, authorized consent
- Automated data collection
- Misleading users about data collection
- Unrelated asset offloading
- Undocumented external data use
- Third-party advertisement tracking without consent

**Required:**
- Opt-in methods or checkbox registration
- Privacy policy documentation (recommended)

**Exception:**
- SaaS services (Twitter, CDN, Akismet-type) grant implied consent upon activation

---

## Guideline 8: Plugins may not send executable code via third-party systems

**Prohibited:**
- Serving updates from non-WordPress.org servers
- Installing premium versions from external sources
- Third-party CDNs for non-font assets (Google Fonts allowed)
- iframes for admin pages
- Unauthorized data list management

**Allowed:**
- External code loading from documented services if secure
- Management services hosted on the service's own domain

---

## Guideline 9: Developers and their plugins must not do anything illegal, dishonest, or morally offensive

**Prohibited:**
- Black hat SEO techniques
- Fake traffic claims or manipulation
- Review manipulation
- Feature-locking implications
- Sockpuppeting (fake accounts/reviews)
- Plagiarism
- False legal compliance claims (GDPR, CCPA without actually complying)
- Unauthorized server/resource use (botnets, crypto-mining)
- Community guideline violations
- Harassment
- Identity falsification
- Guideline loophole exploitation

---

## Guideline 10: Plugins may not embed external links or credits on the public site without explicitly asking the user's permission

**Requirements:**
- "Powered By" displays must be **optional**
- Must **default to OFF**
- Users must explicitly opt-in via clear choices
- Credit displays cannot be required for functionality

**Allowed:**
- Services may brand their own output (e.g., "Powered by Service X" on their embed)

---

## Guideline 11: Plugins should not hijack the admin dashboard

**Prohibited:**
- Excessive alerts and overwhelming notices
- Upgrade prompts outside settings pages (limited contextual use allowed)
- Non-dismissible site-wide notices
- Non-dismissible dashboard widgets
- Dashboard advertising
- Referral tracking in admin

**Required:**
- Site-wide notices must be dismissible or auto-dismiss
- Error messages must include resolution information

**Recommended:**
- Links to developer sites
- Local images (not external)

---

## Guideline 12: Public-facing pages on WordPress.org (readmes) must not spam

**Prohibited:**
- Unnecessary affiliate links
- Competitor plugin tags
- Excessive tags (maximum 5)
- Black hat SEO techniques
- Keyword stuffing
- Alternative product tags (e.g., "Akismet" tag for an Akismet alternative)
- Affiliate link redirects or cloaking

**Allowed:**
- Direct product links (themes/required plugins) in moderation
- Related product tags
- "WooCommerce" tag for WooCommerce extensions
- Affiliate links with proper disclosure and direct linking

**Required:**
- Content must be human-readable, not bot-optimized
- **README must be in English** (as of July 2025)

---

## Guideline 13: Plugins must use WordPress' default libraries

**Must use WordPress-bundled versions:**
- jQuery / jQuery UI
- Backbone.js / Underscore.js
- React
- Moment.js
- Lodash
- PHPMailer
- PHPass
- SimplePie
- Atom Lib

**Prohibited:**
- Including these libraries in your plugin code
- Using different versions than WordPress core

---

## Guideline 14: Frequent commits to SVN should be avoided

**Best Practices:**
- SVN is a **release repository**, not a development system
- Only deploy-ready code (stable, beta, RC) should be pushed
- Descriptive commit messages required
- Avoid rapid-fire tweaks — multiple commits strain the system

**Exception:**
- README updates indicating WordPress version support (can be frequent)

---

## Guideline 15: Plugin version numbers must be incremented for each new release

**Required:**
- Each new release requires version number increase
- Trunk readme.txt must reflect current plugin version
- Version in plugin header must match readme.txt `Stable tag`

**Note:**
- Updates only alert users when version changes
- Users won't see changes without version increment

---

## Guideline 16: A complete plugin must be submitted at time of approval

**Required:**
- Full functional plugin at submission
- Plugin must do what it claims

**Prohibited:**
- Name reservations for future use
- Brand protection submissions
- Placeholder plugins

**Note:**
- Unused approved directories may be reassigned

---

## Guideline 17: Plugins must respect trademarks, copyrights, and project names

**Prohibited:**
- Plugin slug beginning with trademarked terms (without legal ownership proof)
- Using "WordPress", "WP", "WooCommerce", "Woo" to start slugs
- Using competitor/brand names to start slugs

**WordPress Foundation trademarked terms apply to:**
- Domains
- Slugs

**Recommended format:**
- "Feature for [Product]" instead of "[Product] Feature"
- Original branding for clarity and memorability

---

## Guideline 18: We reserve the right to maintain the Plugin Directory to the best of our ability

**WordPress.org reserves the right to:**
- Update guidelines at any time
- Disable or remove plugins (even for unlisted reasons)
- Grant exceptions
- Remove developer access for inactive developers
- Make changes without consent for public safety

**Promises:**
- Exercise rights sparingly and respectfully
- Exception grants and developer assistance when appropriate

---

## Security Requirements (Additional)

- Security issues result in immediate closure until resolved
- Extreme cases allow WordPress Security team to push updates
- Contact information must be current and accurate
- Auto-replies and support system routing prohibited for security contacts

---

## Developer Expectations Summary

Developers must follow:
1. Plugin Directory Guidelines (this document)
2. WordPress Community Guidelines
3. WordPress Forum Guidelines

**Consequences:**
- Violations result in removal until resolution
- Data may not be restored
- Repeat violations trigger all-author removal and developer ban
