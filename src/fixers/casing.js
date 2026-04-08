const fs = require('node:fs');

/**
 * Auto-fix handler for incorrect WordPress/WooCommerce casing.
 *
 * Replaces common misspellings:
 * - Wordpress -> WordPress
 * - wordPress -> WordPress
 * - Woocommerce -> WooCommerce
 * - wooCommerce -> WooCommerce
 *
 * @param {Object} finding - The finding object with evidence_lines
 * @param {Object} rule - The rule definition
 * @param {Object} limits - Scan limits including maxScanFileBytes
 * @param {Function} safeReadText - Function to safely read file contents
 * @returns {number} Number of files modified
 */
function casingFixer(finding, rule, limits, safeReadText) {
  const replacements = [
    { pattern: /\bWordpress\b/g, replacement: 'WordPress' },
    { pattern: /\bwordPress\b/g, replacement: 'WordPress' },
    { pattern: /\bWoocommerce\b/g, replacement: 'WooCommerce' },
    { pattern: /\bwooCommerce\b/g, replacement: 'WooCommerce' },
  ];

  const filesToFix = new Set();

  // Extract file paths from evidence lines (format: "filepath:line:content")
  for (const line of finding.evidence_lines) {
    const parts = line.split(':');
    if (parts.length > 0 && parts[0]) {
      filesToFix.add(parts[0]);
    }
  }

  let fixedCount = 0;

  for (const filePath of filesToFix) {
    try {
      const contents = safeReadText(filePath, limits);
      if (!contents) {
        continue;
      }

      let fixed = contents;
      for (const { pattern, replacement } of replacements) {
        fixed = fixed.replace(pattern, replacement);
      }

      if (fixed !== contents) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        fixedCount += 1;
      }
    } catch (_error) {
      // Ignore errors on individual files
    }
  }

  return fixedCount;
}

module.exports = casingFixer;
