const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const fixturesDir = path.join(repoRoot, 'fixtures');
const serverPath = path.join(repoRoot, 'mcp', 'server.js');

function createClient() {
  const child = spawn('node', [serverPath], {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = Buffer.alloc(0);
  let nextId = 1;
  const pending = new Map();

  child.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        break;
      }

      const header = buffer.slice(0, headerEnd).toString('utf8');
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        buffer = Buffer.alloc(0);
        break;
      }

      const contentLength = Number(match[1]);
      const start = headerEnd + 4;
      const end = start + contentLength;

      if (buffer.length < end) {
        break;
      }

      const body = buffer.slice(start, end).toString('utf8');
      buffer = buffer.slice(end);
      const message = JSON.parse(body);

      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);

        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString('utf8').trim();
    if (text) {
      process.stderr.write(`${text}\n`);
    }
  });

  function sendMessage(message) {
    const json = JSON.stringify(message);
    child.stdin.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`);
  }

  function request(method, params = {}) {
    const id = nextId++;
    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      sendMessage(payload);
    });
  }

  function notify(method, params = {}) {
    sendMessage({
      jsonrpc: '2.0',
      method,
      params,
    });
  }

  async function close() {
    child.stdin.end();
    await new Promise((resolve) => {
      child.on('exit', resolve);
    });
  }

  return {
    request,
    notify,
    close,
  };
}

async function main() {
  const client = createClient();
  const pluginCheckFixture = path.join(repoRoot, 'tests', 'plugin-check-sample.json');
  const pluginCheckStreamFixture = path.join(repoRoot, 'tests', 'plugin-check-results.txt');

  try {
    const init = await client.request('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: {
        name: 'wp-plugin-compliance-test',
        version: '0.1.0',
      },
      capabilities: {},
    });

    assert.equal(init.serverInfo.name, 'wp-plugin-compliance-checker');
    assert.ok(init.capabilities.tools);

    client.notify('notifications/initialized');

    const toolList = await client.request('tools/list');
    const toolNames = toolList.tools.map((tool) => tool.name);

    assert.ok(toolNames.includes('scan_plugin'));
    assert.ok(toolNames.includes('render_report'));
    assert.ok(toolNames.includes('list_rules'));
    assert.ok(toolNames.includes('get_rule'));

    const scan = await client.request('tools/call', {
      name: 'scan_plugin',
      arguments: {
        path: path.join(fixturesDir, 'fail', 'release-artifacts'),
      },
    });

    assert.equal(scan.structuredContent.exit_code, 2);
    assert.equal(scan.structuredContent.report.summary.errors, 2);

    const mergedScan = await client.request('tools/call', {
      name: 'scan_plugin',
      arguments: {
        path: path.join(fixturesDir, 'fail', 'release-artifacts'),
        plugin_check_json_path: pluginCheckFixture,
      },
    });

    assert.equal(mergedScan.structuredContent.exit_code, 3);
    assert.equal(mergedScan.structuredContent.report.summary.errors, 3);
    assert.equal(mergedScan.structuredContent.report.summary.warnings, 1);
    assert.equal(mergedScan.structuredContent.report.sources.plugin_check.findings, 2);
    assert.ok(mergedScan.structuredContent.report.findings.some((finding) => finding.source === 'plugin_check'));

    const mergedStreamScan = await client.request('tools/call', {
      name: 'scan_plugin',
      arguments: {
        path: path.join(fixturesDir, 'fail', 'release-artifacts'),
        plugin_check_report_path: pluginCheckStreamFixture,
      },
    });

    assert.equal(mergedStreamScan.structuredContent.exit_code, 3);
    assert.equal(mergedStreamScan.structuredContent.report.imports[0].format, 'cli-json-stream');

    const reportCall = await client.request('tools/call', {
      name: 'render_report',
      arguments: {
        report: mergedStreamScan.structuredContent.report,
      },
    });

    assert.match(reportCall.structuredContent.markdown, /# WordPress\.org Compliance Report/);
    assert.match(reportCall.structuredContent.markdown, /plugin_repo\.forbidden_release_files/);
    assert.match(reportCall.structuredContent.markdown, /plugin_header_fields/);

    const listRulesCall = await client.request('tools/call', {
      name: 'list_rules',
      arguments: {
        severity: 'error',
      },
    });

    assert.ok(Array.isArray(listRulesCall.structuredContent.rules));
    assert.ok(listRulesCall.structuredContent.rules.length > 0);

    const getRuleCall = await client.request('tools/call', {
      name: 'get_rule',
      arguments: {
        rule_id: 'plugin_repo.direct_file_access',
      },
    });

    assert.equal(getRuleCall.structuredContent.rule.id, 'plugin_repo.direct_file_access');
    assert.equal(getRuleCall.structuredContent.rule.coverage, 'heuristic');

    const restrictedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-plugin-compliance-mcp-'));

    try {
      const outsidePluginDir = path.join(restrictedRoot, 'outside-plugin');
      fs.cpSync(path.join(fixturesDir, 'fail', 'release-artifacts'), outsidePluginDir, { recursive: true });

      await assert.rejects(async () => {
        await client.request('tools/call', {
          name: 'scan_plugin',
          arguments: {
            path: outsidePluginDir,
          },
        });
      }, /allowed roots/);

      const outsideReport = path.join(restrictedRoot, 'plugin-check-sample.json');
      fs.copyFileSync(pluginCheckFixture, outsideReport);

      await assert.rejects(async () => {
        await client.request('tools/call', {
          name: 'scan_plugin',
          arguments: {
            path: path.join(fixturesDir, 'fail', 'release-artifacts'),
            plugin_check_json_path: outsideReport,
          },
        });
      }, /allowed roots/);
    } finally {
      fs.rmSync(restrictedRoot, { recursive: true, force: true });
    }

    console.log('All MCP tool tests passed.');
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
