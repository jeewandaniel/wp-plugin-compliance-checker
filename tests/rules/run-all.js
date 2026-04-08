#!/usr/bin/env node

/**
 * Runs all per-rule unit tests.
 *
 * Usage: node tests/rules/run-all.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rulesTestDir = __dirname;

function main() {
  const testFiles = fs.readdirSync(rulesTestDir)
    .filter(file => file.startsWith('test-') && file.endsWith('.js'))
    .sort();

  if (testFiles.length === 0) {
    console.log('No rule tests found.');
    return;
  }

  console.log(`Running ${testFiles.length} rule test file(s)...\n`);

  let passed = 0;
  let failed = 0;

  for (const testFile of testFiles) {
    const testPath = path.join(rulesTestDir, testFile);
    const result = spawnSync('node', [testPath], {
      stdio: 'inherit',
      encoding: 'utf8',
    });

    if (result.status === 0) {
      passed += 1;
    } else {
      failed += 1;
      console.error(`\n✗ ${testFile} FAILED\n`);
    }
  }

  console.log('=====================================');
  console.log(`Rule tests: ${passed} passed, ${failed} failed`);
  console.log('=====================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
