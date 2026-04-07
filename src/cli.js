#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { scanPlugin } = require('./engine');
const { renderHumanReport, renderMarkdownReport } = require('./report');

const repoRoot = path.resolve(__dirname, '..');

function printUsage() {
  process.stdout.write(`Usage:
  wp-plugin-compliance scan [--format human|json] [--plugin-check-report report.{json,txt}] [--plugin-check-auto] [--plugin-check-json report.json] /path/to/plugin-or-zip
  wp-plugin-compliance report [report.json]
  wp-plugin-compliance test
  wp-plugin-compliance help

Commands:
  scan     Run the shared compliance scan.
  report   Render a markdown report from JSON scan output.
  test     Run the local regression suites.
  help     Show this message.
`);
}

function parseScanArgs(argv) {
  const positional = [];
  let format = 'human';
  const pluginCheckJsonPaths = [];
  const pluginCheckReportPaths = [];
  let pluginCheckAuto = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--format') {
      index += 1;
      if (index >= argv.length) {
        throw new Error('Missing value for --format');
      }
      format = argv[index];
      continue;
    }

    if (value.startsWith('--format=')) {
      format = value.slice('--format='.length);
      continue;
    }

    if (value === '--plugin-check-json') {
      index += 1;
      if (index >= argv.length) {
        throw new Error('Missing value for --plugin-check-json');
      }
      pluginCheckJsonPaths.push(argv[index]);
      continue;
    }

    if (value.startsWith('--plugin-check-json=')) {
      pluginCheckJsonPaths.push(value.slice('--plugin-check-json='.length));
      continue;
    }

    if (value === '--plugin-check-report') {
      index += 1;
      if (index >= argv.length) {
        throw new Error('Missing value for --plugin-check-report');
      }
      pluginCheckReportPaths.push(argv[index]);
      continue;
    }

    if (value.startsWith('--plugin-check-report=')) {
      pluginCheckReportPaths.push(value.slice('--plugin-check-report='.length));
      continue;
    }

    if (value === '--plugin-check-auto') {
      pluginCheckAuto = true;
      continue;
    }

    if (value === '-h' || value === '--help') {
      printUsage();
      process.exit(0);
    }

    positional.push(value);
  }

  if (!['human', 'json'].includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  if (positional.length !== 1) {
    throw new Error('scan requires exactly one plugin directory or ZIP path.');
  }

  return {
    format,
    targetPath: positional[0],
    pluginCheckJsonPaths,
    pluginCheckReportPaths,
    pluginCheckAuto,
  };
}

function readReportInput(filePath) {
  if (filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const input = fs.readFileSync(0, 'utf8');
  return JSON.parse(input);
}

function runTestScript(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  const command = fullPath.endsWith('.js') ? 'node' : 'bash';
  const result = spawnSync(command, [fullPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function main() {
  const command = process.argv[2] || 'help';
  const runnerLabel = process.env.WP_PLUGIN_COMPLIANCE_RUNNER || 'wp-plugin-compliance';

  switch (command) {
    case 'scan': {
      const { format, targetPath, pluginCheckJsonPaths, pluginCheckReportPaths, pluginCheckAuto } = parseScanArgs(process.argv.slice(3));
      const scan = scanPlugin(repoRoot, targetPath, {
        runnerLabel,
        pluginCheckJsonPaths,
        pluginCheckReportPaths,
        pluginCheckAuto,
      });
      const output = format === 'json'
        ? JSON.stringify(scan.report, null, 2)
        : renderHumanReport(scan.report);

      process.stdout.write(output);
      if (!output.endsWith('\n')) {
        process.stdout.write('\n');
      }
      process.exit(scan.exitCode);
      break;
    }

    case 'report': {
      const reportPath = process.argv[3];
      const report = readReportInput(reportPath);
      process.stdout.write(renderMarkdownReport(report));
      break;
    }

    case 'test':
      runTestScript('tests/test-core-engine.js');
      runTestScript('tests/test-rules-runner.sh');
      runTestScript('tests/test-compat-wrapper.sh');
      runTestScript('tests/test-reporting.sh');
      runTestScript('tests/test-mcp-smoke.sh');
      break;

    case 'help':
    case '-h':
    case '--help':
      printUsage();
      break;

    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      printUsage();
      process.exit(1);
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
