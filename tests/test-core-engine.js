#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { scanPlugin } = require('../src/engine');
const { renderMarkdownReport } = require('../src/report');
const { listRules, getRule } = require('../src/rules');
const { canonicalizePath } = require('../src/security');

const repoRoot = path.resolve(__dirname, '..');
const fixturesDir = path.join(repoRoot, 'fixtures');

function main() {
  const pluginCheckFixture = path.join(__dirname, 'plugin-check-sample.json');
  const pluginCheckStreamFixture = path.join(__dirname, 'plugin-check-results.txt');
  const namingFixture = path.join(fixturesDir, 'fail', 'naming-and-readme');
  const namingScan = scanPlugin(repoRoot, namingFixture, { runnerLabel: 'core-engine-test' });
  const restrictedNamingScan = scanPlugin(repoRoot, namingFixture, {
    runnerLabel: 'core-engine-test',
    allowedRoots: [repoRoot],
  });

  assert.equal(namingScan.exitCode, 3);
  assert.equal(namingScan.report.summary.errors, 3);
  assert.ok(namingScan.report.findings.some((finding) => finding.rule_id === 'plugin_repo.direct_file_access'));
  assert.equal(namingScan.report.runner, 'core-engine-test');
  assert.equal(restrictedNamingScan.exitCode, 3);

  const markdown = renderMarkdownReport(namingScan.report);
  assert.match(markdown, /# WordPress\.org Compliance Report/);
  assert.match(markdown, /plugin_repo\.direct_file_access/);

  const mergedScan = scanPlugin(repoRoot, namingFixture, {
    runnerLabel: 'core-engine-test',
    pluginCheckJsonPaths: [pluginCheckFixture],
  });
  assert.equal(mergedScan.report.summary.errors, 4);
  assert.equal(mergedScan.report.summary.warnings, 1);
  assert.equal(mergedScan.report.sources.project.findings, 3);
  assert.equal(mergedScan.report.sources.plugin_check.findings, 2);
  assert.equal(mergedScan.report.imports.length, 1);
  assert.ok(mergedScan.report.findings.some((finding) => finding.source === 'plugin_check'));
  assert.equal(mergedScan.report.verdict, 'needs_attention');

  const mergedStreamScan = scanPlugin(repoRoot, namingFixture, {
    runnerLabel: 'core-engine-test',
    pluginCheckReportPaths: [pluginCheckStreamFixture],
  });
  assert.equal(mergedStreamScan.report.summary.errors, 4);
  assert.equal(mergedStreamScan.report.summary.warnings, 1);
  assert.equal(mergedStreamScan.report.imports[0].type, 'plugin_check_cli_json_stream');
  assert.equal(mergedStreamScan.report.imports[0].format, 'cli-json-stream');
  assert.ok(mergedStreamScan.report.findings.some((finding) => finding.locations.length > 0));

  const autoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-plugin-compliance-auto-'));

  try {
    const pluginDir = path.join(autoRoot, 'auto-plugin');
    fs.cpSync(path.join(fixturesDir, 'fail', 'release-artifacts'), pluginDir, { recursive: true });
    fs.copyFileSync(pluginCheckStreamFixture, path.join(autoRoot, 'plugin-check-results.txt'));

    const autoScan = scanPlugin(repoRoot, pluginDir, {
      runnerLabel: 'core-engine-test',
      pluginCheckAuto: true,
    });

    assert.equal(autoScan.report.summary.errors, 3);
    assert.equal(autoScan.report.summary.warnings, 1);
    assert.equal(autoScan.report.sources.plugin_check.findings, 2);
  } finally {
    fs.rmSync(autoRoot, { recursive: true, force: true });
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-plugin-compliance-zip-test-'));

  try {
    const zipPath = path.join(tmpRoot, 'release-artifacts.zip');
    const zipResult = spawnSync('zip', ['-qr', zipPath, 'release-artifacts'], {
      cwd: path.join(fixturesDir, 'fail'),
      encoding: 'utf8',
    });

    if (zipResult.error) {
      throw zipResult.error;
    }

    assert.equal(zipResult.status, 0);

    const zipScan = scanPlugin(repoRoot, zipPath, { runnerLabel: 'core-engine-test' });
    assert.equal(zipScan.exitCode, 2);
    assert.equal(zipScan.report.summary.errors, 2);
    assert.equal(zipScan.report.plugin_dir, canonicalizePath(zipPath));
    assert.ok(zipScan.report.findings.some((finding) => finding.rule_id === 'plugin_repo.forbidden_release_files'));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-plugin-compliance-restricted-'));

  try {
    const outsidePluginDir = path.join(outsideRoot, 'outside-plugin');
    fs.cpSync(namingFixture, outsidePluginDir, { recursive: true });

    assert.throws(() => {
      scanPlugin(repoRoot, outsidePluginDir, {
        runnerLabel: 'core-engine-test',
        allowedRoots: [repoRoot],
      });
    }, /allowed roots/);
  } finally {
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  }

  const errorRules = listRules(repoRoot, { severity: 'error' });
  assert.ok(errorRules.length > 0);

  const directFileAccessRule = getRule(repoRoot, 'plugin_repo.direct_file_access');
  assert.equal(directFileAccessRule.id, 'plugin_repo.direct_file_access');
  assert.equal(directFileAccessRule.coverage, 'heuristic');

  console.log('All core engine tests passed.');
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}
