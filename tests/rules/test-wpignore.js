#!/usr/bin/env node

/**
 * Unit tests for .wpignore functionality.
 *
 * Tests that:
 * - Vendor directories are properly excluded
 * - .wpignore patterns work correctly
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const { scanPlugin } = require('../../src/engine');

const repoRoot = path.resolve(__dirname, '../..');
const fixturesDir = path.join(repoRoot, 'fixtures');

function runTests() {
  console.log('Testing: .wpignore functionality');

  // Test 1: Vendor directory is excluded via .wpignore
  {
    const vendorFixture = path.join(fixturesDir, 'edge-cases', 'vendor-false-positive');
    const result = scanPlugin(repoRoot, vendorFixture, { runnerLabel: 'test' });

    // The vendor/some-lib/library.php has eval(), passthru(), proc_open()
    // But it should be excluded by .wpignore
    const forbiddenFinding = result.report.findings.find(f =>
      f.rule_id === 'plugin_repo.forbidden_functions' &&
      f.evidence.includes('vendor/')
    );

    assert.ok(!forbiddenFinding, 'Vendor directory should be excluded by .wpignore');
    console.log('  ✓ Vendor directory excluded via .wpignore');
  }

  // Test 2: Main plugin file is still scanned
  {
    const vendorFixture = path.join(fixturesDir, 'edge-cases', 'vendor-false-positive');
    const result = scanPlugin(repoRoot, vendorFixture, { runnerLabel: 'test' });

    // The main plugin file should be scanned (and should pass since it's clean)
    assert.ok(result.report.summary.executed_rules > 0, 'Rules should be executed on main plugin');
    console.log('  ✓ Main plugin file is scanned');
  }

  console.log('All .wpignore tests passed!\n');
}

try {
  runTests();
} catch (error) {
  console.error('Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
