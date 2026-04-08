/**
 * File hash caching for incremental scanning.
 *
 * This module tracks file content hashes to skip unchanged files during
 * subsequent scans, significantly speeding up large plugin analysis.
 *
 * Cache format (JSON):
 * {
 *   "version": 1,
 *   "rulesVersion": "hash-of-rules-index",
 *   "files": {
 *     "/path/to/file.php": {
 *       "hash": "sha256-content-hash",
 *       "mtime": 1234567890,
 *       "size": 1234
 *     }
 *   },
 *   "findings": {
 *     "/path/to/file.php": [
 *       { "rule_id": "...", "evidence_lines": [...] }
 *     ]
 *   }
 * }
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const CACHE_VERSION = 1;
const CACHE_FILENAME = '.wp-compliance-cache.json';

/**
 * Compute SHA-256 hash of file contents.
 * @param {string} filePath - Path to file
 * @returns {string|null} Hash string or null on error
 */
function computeFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (_error) {
    return null;
  }
}

/**
 * Compute hash of rules index to detect rule changes.
 * @param {string} rulesIndexPath - Path to rules/index.json
 * @returns {string} Hash string
 */
function computeRulesHash(rulesIndexPath) {
  try {
    const content = fs.readFileSync(rulesIndexPath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  } catch (_error) {
    return 'unknown';
  }
}

/**
 * Load cache from scan directory.
 * @param {string} scanPath - Plugin directory path
 * @returns {Object} Cache object (empty if not found or invalid)
 */
function loadCache(scanPath) {
  const cachePath = path.join(scanPath, CACHE_FILENAME);

  try {
    if (!fs.existsSync(cachePath)) {
      return createEmptyCache();
    }

    const content = fs.readFileSync(cachePath, 'utf8');
    const cache = JSON.parse(content);

    // Validate cache version
    if (cache.version !== CACHE_VERSION) {
      return createEmptyCache();
    }

    return cache;
  } catch (_error) {
    return createEmptyCache();
  }
}

/**
 * Save cache to scan directory.
 * @param {string} scanPath - Plugin directory path
 * @param {Object} cache - Cache object to save
 */
function saveCache(scanPath, cache) {
  const cachePath = path.join(scanPath, CACHE_FILENAME);

  try {
    const content = JSON.stringify(cache, null, 2);
    fs.writeFileSync(cachePath, content, 'utf8');
  } catch (_error) {
    // Ignore cache write errors (e.g., read-only filesystem)
  }
}

/**
 * Create empty cache structure.
 * @returns {Object} Empty cache
 */
function createEmptyCache() {
  return {
    version: CACHE_VERSION,
    rulesVersion: null,
    generatedAt: null,
    files: {},
    findings: {},
  };
}

/**
 * Check if a file has changed since last cache.
 * @param {Object} cache - Current cache
 * @param {string} filePath - File to check
 * @returns {boolean} True if file changed or not in cache
 */
function isFileChanged(cache, filePath) {
  const cached = cache.files[filePath];
  if (!cached) {
    return true;
  }

  try {
    const stat = fs.statSync(filePath);

    // Quick check: mtime and size
    if (stat.mtimeMs !== cached.mtime || stat.size !== cached.size) {
      return true;
    }

    // Content hash check (more expensive but definitive)
    const currentHash = computeFileHash(filePath);
    return currentHash !== cached.hash;
  } catch (_error) {
    return true;
  }
}

/**
 * Update cache entry for a file.
 * @param {Object} cache - Cache to update
 * @param {string} filePath - File path
 * @param {Array} findings - Findings for this file (can be empty)
 */
function updateCacheEntry(cache, filePath, findings = []) {
  try {
    const stat = fs.statSync(filePath);
    const hash = computeFileHash(filePath);

    cache.files[filePath] = {
      hash,
      mtime: stat.mtimeMs,
      size: stat.size,
    };

    if (findings.length > 0) {
      cache.findings[filePath] = findings;
    } else {
      delete cache.findings[filePath];
    }
  } catch (_error) {
    // Skip files that can't be read
  }
}

/**
 * Get cached findings for a file.
 * @param {Object} cache - Current cache
 * @param {string} filePath - File path
 * @returns {Array|null} Cached findings or null if not cached
 */
function getCachedFindings(cache, filePath) {
  if (isFileChanged(cache, filePath)) {
    return null;
  }
  return cache.findings[filePath] || [];
}

/**
 * Remove deleted files from cache.
 * @param {Object} cache - Cache to clean
 * @param {Set} existingFiles - Set of currently existing file paths
 */
function cleanupDeletedFiles(cache, existingFiles) {
  for (const filePath of Object.keys(cache.files)) {
    if (!existingFiles.has(filePath)) {
      delete cache.files[filePath];
      delete cache.findings[filePath];
    }
  }
}

/**
 * Check if rules have changed since cache was generated.
 * @param {Object} cache - Current cache
 * @param {string} rulesIndexPath - Path to rules/index.json
 * @returns {boolean} True if rules changed
 */
function areRulesChanged(cache, rulesIndexPath) {
  const currentHash = computeRulesHash(rulesIndexPath);
  return cache.rulesVersion !== currentHash;
}

/**
 * Create a scan context with caching support.
 * @param {string} scanPath - Plugin directory
 * @param {string} rulesIndexPath - Path to rules index
 * @param {boolean} useCache - Whether to use caching
 * @returns {Object} Context with cache helpers
 */
function createCacheContext(scanPath, rulesIndexPath, useCache = true) {
  if (!useCache) {
    return {
      enabled: false,
      isFileChanged: () => true,
      getCachedFindings: () => null,
      updateEntry: () => {},
      save: () => {},
    };
  }

  const cache = loadCache(scanPath);
  const rulesChanged = areRulesChanged(cache, rulesIndexPath);

  // If rules changed, invalidate entire cache
  if (rulesChanged) {
    cache.files = {};
    cache.findings = {};
    cache.rulesVersion = computeRulesHash(rulesIndexPath);
  }

  return {
    enabled: true,
    rulesChanged,
    cache,
    isFileChanged: (filePath) => isFileChanged(cache, filePath),
    getCachedFindings: (filePath) => getCachedFindings(cache, filePath),
    updateEntry: (filePath, findings) => updateCacheEntry(cache, filePath, findings),
    cleanup: (existingFiles) => cleanupDeletedFiles(cache, existingFiles),
    save: () => {
      cache.generatedAt = new Date().toISOString();
      saveCache(scanPath, cache);
    },
  };
}

/**
 * Get cache statistics.
 * @param {Object} cache - Cache object
 * @returns {Object} Stats object
 */
function getCacheStats(cache) {
  const fileCount = Object.keys(cache.files).length;
  const findingsCount = Object.values(cache.findings).reduce((sum, arr) => sum + arr.length, 0);

  return {
    fileCount,
    findingsCount,
    generatedAt: cache.generatedAt,
    rulesVersion: cache.rulesVersion,
  };
}

module.exports = {
  CACHE_FILENAME,
  computeFileHash,
  computeRulesHash,
  loadCache,
  saveCache,
  createEmptyCache,
  isFileChanged,
  updateCacheEntry,
  getCachedFindings,
  cleanupDeletedFiles,
  areRulesChanged,
  createCacheContext,
  getCacheStats,
};
