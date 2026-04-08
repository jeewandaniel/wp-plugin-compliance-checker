const fs = require('node:fs');
const path = require('node:path');
const { runScan, renderMarkdown } = require('./lib/cli');
const { listRules, getRule } = require('./lib/rules');
const {
  assertFilePathAllowed,
  assertPathAllowed,
  resolveAllowedRoots,
  sanitizeControlChars,
} = require('../src/security');

function getServerInfo() {
  try {
    const pkg = require('../package.json');
    return {
      name: pkg.name,
      version: pkg.version,
    };
  } catch (_error) {
    return {
      name: 'wp-plugin-compliance-checker',
      version: '0.0.0',
    };
  }
}

const SERVER_INFO = getServerInfo();

const repoRoot = path.resolve(__dirname, '..');
let inputBuffer = Buffer.alloc(0);

function parseAllowedRoots(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getMcpAllowedRoots() {
  if (process.env.WP_PLUGIN_COMPLIANCE_MCP_ALLOW_ANY_PATH === '1') {
    return [];
  }

  const configuredRoots = parseAllowedRoots(process.env.WP_PLUGIN_COMPLIANCE_ALLOWED_ROOTS);
  return resolveAllowedRoots(configuredRoots.length > 0 ? configuredRoots : [process.cwd()]);
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  const payload = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
  process.stdout.write(payload);
}

function sendResult(id, result) {
  writeMessage({
    jsonrpc: '2.0',
    id,
    result,
  });
}

function sendError(id, code, message, data) {
  writeMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data,
    },
  });
}

function ensureScanPath(pluginPath) {
  if (!pluginPath || typeof pluginPath !== 'string') {
    throw new Error('A plugin directory or ZIP path is required.');
  }

  const allowedRoots = getMcpAllowedRoots();
  const resolvedPath = assertPathAllowed(pluginPath, allowedRoots, 'Scan target');

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);

  if (stat.isDirectory()) {
    return resolvedPath;
  }

  if (stat.isFile() && resolvedPath.endsWith('.zip')) {
    return resolvedPath;
  }

  throw new Error(`Path is not a plugin directory or ZIP archive: ${resolvedPath}`);
}

function ensureReportPath(reportPath, label) {
  if (!reportPath) {
    return null;
  }

  return assertFilePathAllowed(reportPath, getMcpAllowedRoots(), label).path;
}

function summarizeReport(report) {
  const lines = [
    `Errors: ${report.summary.errors}`,
    `Warnings: ${report.summary.warnings}`,
    `Advisories: ${report.summary.advisories}`,
    `Executed rules: ${report.summary.executed_rules}`,
  ];

  if (report.sources && report.sources.plugin_check && report.sources.plugin_check.findings > 0) {
    lines.push(`Imported Plugin Check findings: ${report.sources.plugin_check.findings}`);
  }

  return lines.join('\n');
}

function toolDefinitions() {
  return [
    {
      name: 'scan_plugin',
      description: 'Run the shared compliance scan against a local plugin directory and return the structured report.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['path'],
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or relative path to the plugin directory or ZIP archive to scan within the allowed MCP roots.',
          },
          plugin_check_json_path: {
            type: 'string',
            description: 'Optional path to a saved Plugin Check JSON report to merge into the shared findings model.',
          },
          plugin_check_report_path: {
            type: 'string',
            description: 'Optional path to a saved Plugin Check CLI results file or JSON report to merge into the shared findings model.',
          },
          plugin_check_auto: {
            type: 'boolean',
            description: 'Automatically discover common plugin-check-results artifacts near the scan target and repository root.',
          },
        },
      },
    },
    {
      name: 'render_report',
      description: 'Render a markdown compliance report from either a local plugin path or an existing report object.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: {
            type: 'string',
            description: 'Plugin directory or ZIP archive path to scan before rendering.',
          },
          plugin_check_json_path: {
            type: 'string',
            description: 'Optional path to a saved Plugin Check JSON report to merge into the scan before rendering.',
          },
          plugin_check_report_path: {
            type: 'string',
            description: 'Optional path to a saved Plugin Check CLI results file or JSON report to merge into the scan before rendering.',
          },
          plugin_check_auto: {
            type: 'boolean',
            description: 'Automatically discover common plugin-check-results artifacts near the scan target and repository root.',
          },
          report: {
            type: 'object',
            description: 'Existing structured report object matching the scanner JSON format.',
          },
        },
      },
    },
    {
      name: 'list_rules',
      description: 'List the currently indexed project rules, optionally filtered by category, severity, or coverage.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          severity: { type: 'string' },
          coverage: { type: 'string' },
        },
      },
    },
    {
      name: 'get_rule',
      description: 'Return the full definition for a single project rule by ID.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['rule_id'],
        properties: {
          rule_id: {
            type: 'string',
            description: 'The rule ID to load, such as plugin_repo.direct_file_access.',
          },
        },
      },
    },
  ];
}

function normalizeToolResult(result) {
  if (result && typeof result === 'object' && Array.isArray(result.content)) {
    return result;
  }

  return {
    content: [
      {
        type: 'text',
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      },
    ],
  };
}

function handleToolCall(name, args = {}) {
  switch (name) {
    case 'scan_plugin': {
      const allowedRoots = getMcpAllowedRoots();
      const scanPath = ensureScanPath(args.path);
      const pluginCheckJsonPath = ensureReportPath(args.plugin_check_json_path, 'Plugin Check JSON report');
      const pluginCheckReportPath = ensureReportPath(args.plugin_check_report_path, 'Plugin Check report');
      const scan = runScan(repoRoot, scanPath, {
        allowedRoots,
        pluginCheckJsonPaths: pluginCheckJsonPath ? [pluginCheckJsonPath] : [],
        pluginCheckReportPaths: pluginCheckReportPath ? [pluginCheckReportPath] : [],
        pluginCheckAuto: args.plugin_check_auto === true,
      });
      return normalizeToolResult({
        content: [
          {
            type: 'text',
            text: summarizeReport(scan.report),
          },
        ],
        structuredContent: {
          ok: scan.exitCode === 0,
          exit_code: scan.exitCode,
          report: scan.report,
        },
        isError: false,
      });
    }

    case 'render_report': {
      let report = args.report;
      let exitCode = 0;

      if (!report && args.path) {
        const allowedRoots = getMcpAllowedRoots();
        const scanPath = ensureScanPath(args.path);
        const pluginCheckJsonPath = ensureReportPath(args.plugin_check_json_path, 'Plugin Check JSON report');
        const pluginCheckReportPath = ensureReportPath(args.plugin_check_report_path, 'Plugin Check report');
        const scan = runScan(repoRoot, scanPath, {
          allowedRoots,
          pluginCheckJsonPaths: pluginCheckJsonPath ? [pluginCheckJsonPath] : [],
          pluginCheckReportPaths: pluginCheckReportPath ? [pluginCheckReportPath] : [],
          pluginCheckAuto: args.plugin_check_auto === true,
        });
        report = scan.report;
        exitCode = scan.exitCode;
      }

      if (!report) {
        throw new Error('render_report requires either path or report.');
      }

      const markdown = renderMarkdown(repoRoot, report);
      return normalizeToolResult({
        content: [
          {
            type: 'text',
            text: markdown,
          },
        ],
        structuredContent: {
          ok: exitCode === 0,
          markdown,
          report,
        },
        isError: false,
      });
    }

    case 'list_rules': {
      const rules = listRules(repoRoot, args);
      return normalizeToolResult({
        content: [
          {
            type: 'text',
            text: rules.map((rule) => `${rule.id} (${rule.severity}, ${rule.coverage})`).join('\n'),
          },
        ],
        structuredContent: {
          count: rules.length,
          rules,
        },
        isError: false,
      });
    }

    case 'get_rule': {
      const rule = getRule(repoRoot, args.rule_id);

      if (!rule) {
        return normalizeToolResult({
          content: [
            {
              type: 'text',
              text: `Rule not found: ${args.rule_id}`,
            },
          ],
          structuredContent: {
            ok: false,
            rule: null,
          },
          isError: true,
        });
      }

      return normalizeToolResult({
        content: [
          {
            type: 'text',
            text: sanitizeControlChars(`${rule.id}\n${rule.title}\n${rule.summary}`),
          },
        ],
        structuredContent: {
          ok: true,
          rule,
        },
        isError: false,
      });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function handleRequest(message) {
  const { id, method, params } = message;

  try {
    switch (method) {
      case 'initialize':
        sendResult(id, {
          protocolVersion: params && params.protocolVersion ? params.protocolVersion : '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: SERVER_INFO,
        });
        return;

      case 'notifications/initialized':
        return;

      case 'ping':
        sendResult(id, {});
        return;

      case 'tools/list':
        sendResult(id, {
          tools: toolDefinitions(),
        });
        return;

      case 'tools/call':
        sendResult(id, handleToolCall(params.name, params.arguments || {}));
        return;

      default:
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    sendError(id, -32603, error.message, {
      stack: error.stack,
    });
  }
}

function processBuffer() {
  while (true) {
    const headerEnd = inputBuffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      return;
    }

    const header = inputBuffer.slice(0, headerEnd).toString('utf8');
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      inputBuffer = Buffer.alloc(0);
      return;
    }

    const contentLength = Number(match[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;

    if (inputBuffer.length < messageEnd) {
      return;
    }

    const body = inputBuffer.slice(messageStart, messageEnd).toString('utf8');
    inputBuffer = inputBuffer.slice(messageEnd);

    if (!body.trim()) {
      continue;
    }

    let message;
    try {
      message = JSON.parse(body);
    } catch (error) {
      continue;
    }

    handleRequest(message);
  }
}

process.stdin.on('data', (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  processBuffer();
});

process.stdin.on('end', () => {
  process.exit(0);
});
