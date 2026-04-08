#!/usr/bin/env node

/**
 * Unit tests for the forbidden-functions rule.
 *
 * Tests various scenarios:
 * - Detects eval() calls
 * - Detects other forbidden functions
 * - Ignores functions in comments
 * - Handles edge cases
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// We'll test by creating temporary PHP files and running the scanner
const { scanPlugin } = require('../../src/engine');

const repoRoot = path.resolve(__dirname, '../..');

function createTempPlugin(files) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-compliance-test-'));

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(tmpDir, filename);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return tmpDir;
}

function cleanupTempPlugin(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function runTests() {
  console.log('Testing: forbidden-functions rule');

  // Test 1: Detects eval() in PHP files
  {
    const tmpDir = createTempPlugin({
      'test-plugin.php': `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

function dangerous_code() {
  eval('echo "hello";');
}
`,
      'readme.txt': `=== Test Plugin ===
Stable tag: 1.0.0
Tags: test
`
    });

    try {
      const result = scanPlugin(repoRoot, tmpDir, { runnerLabel: 'test' });
      const evalFinding = result.report.findings.find(f =>
        f.rule_id === 'plugin_repo.forbidden_functions' &&
        f.evidence.includes('eval(')
      );

      assert.ok(evalFinding, 'Should detect eval() call');
      console.log('  ✓ Detects eval() in PHP files');
    } finally {
      cleanupTempPlugin(tmpDir);
    }
  }

  // Test 2: Ignores eval in single-line comments
  // Note: The engine uses basic comment detection - lines starting with //, *, or #
  {
    const tmpDir = createTempPlugin({
      'test-plugin.php': `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

// Don't use eval() - it's dangerous
# eval() is also mentioned here in a shell-style comment
 * eval() in a block comment line
function safe_code() {
  echo "hello";
}
`,
      'readme.txt': `=== Test Plugin ===
Stable tag: 1.0.0
Tags: test
`
    });

    try {
      const result = scanPlugin(repoRoot, tmpDir, { runnerLabel: 'test' });
      const evalFinding = result.report.findings.find(f =>
        f.rule_id === 'plugin_repo.forbidden_functions'
      );

      // The rule has ignore_comments: true, so lines starting with //, *, or # should be skipped
      assert.ok(!evalFinding, 'Should ignore eval() in comment lines');
      console.log('  ✓ Ignores eval() in comment lines');
    } finally {
      cleanupTempPlugin(tmpDir);
    }
  }

  // Test 3: Detects multiple forbidden functions
  {
    const tmpDir = createTempPlugin({
      'test-plugin.php': `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

function bad_code() {
  passthru('ls -la');
  proc_open('cmd', [], $pipes);
}
`,
      'readme.txt': `=== Test Plugin ===
Stable tag: 1.0.0
Tags: test
`
    });

    try {
      const result = scanPlugin(repoRoot, tmpDir, { runnerLabel: 'test' });
      const forbiddenFinding = result.report.findings.find(f =>
        f.rule_id === 'plugin_repo.forbidden_functions'
      );

      assert.ok(forbiddenFinding, 'Should detect forbidden functions');
      assert.ok(forbiddenFinding.evidence.includes('passthru('), 'Should detect passthru()');
      assert.ok(forbiddenFinding.evidence.includes('proc_open('), 'Should detect proc_open()');
      console.log('  ✓ Detects multiple forbidden functions');
    } finally {
      cleanupTempPlugin(tmpDir);
    }
  }

  // Test 4: Clean plugin passes
  {
    const tmpDir = createTempPlugin({
      'test-plugin.php': `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) exit;

function safe_code() {
  $result = wp_remote_get('https://example.com');
  return $result;
}
`,
      'readme.txt': `=== Test Plugin ===
Stable tag: 1.0.0
Tags: test
`
    });

    try {
      const result = scanPlugin(repoRoot, tmpDir, { runnerLabel: 'test' });
      const forbiddenFinding = result.report.findings.find(f =>
        f.rule_id === 'plugin_repo.forbidden_functions'
      );

      assert.ok(!forbiddenFinding, 'Clean plugin should not trigger forbidden functions rule');
      console.log('  ✓ Clean plugin passes');
    } finally {
      cleanupTempPlugin(tmpDir);
    }
  }

  console.log('All forbidden-functions tests passed!\n');
}

try {
  runTests();
} catch (error) {
  console.error('Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
