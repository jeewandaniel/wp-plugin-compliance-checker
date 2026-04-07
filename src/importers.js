const fs = require('node:fs');
const path = require('node:path');
const { assertFilePathAllowed, assertPathAllowed, canonicalizePath, resolveAllowedRoots } = require('./security');

const REPORT_FILE_PATTERN = /^plugin-check-results(?:-[\w.-]+)?\.(txt|json)$/i;
const REPORT_DIR_PATTERN = /^plugin-check-results(?:-[\w.-]+)?$/i;
const DEFAULT_MAX_REPORT_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_DISCOVERED_REPORTS = 25;

function readJson(filePath, maxBytes) {
  return JSON.parse(readText(filePath, maxBytes));
}

function readText(filePath, maxBytes) {
  const stats = fs.statSync(filePath);

  if (stats.size > maxBytes) {
    throw new Error(`Report file exceeds size limit (${stats.size} bytes): ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeSeverity(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['error', 'errors', 'fatal', 'fail', 'failed'].includes(normalized)) {
    return 'error';
  }

  if (['warning', 'warnings', 'warn'].includes(normalized)) {
    return 'warning';
  }

  if (['advisory', 'notice', 'notices', 'recommendation'].includes(normalized)) {
    return 'advisory';
  }

  if (['info', 'information', 'informational'].includes(normalized)) {
    return 'info';
  }

  return 'warning';
}

function normalizeRuleId(issue) {
  return (
    issue.rule_id ||
    issue.code ||
    issue.check ||
    issue.check_name ||
    issue.slug ||
    issue.id ||
    'plugin_check.imported_finding'
  );
}

function normalizeTitle(issue, ruleId) {
  return (
    issue.title ||
    issue.check_name ||
    issue.check ||
    issue.rule ||
    issue.code ||
    issue.message ||
    ruleId
  );
}

function normalizeSummary(issue, title) {
  return (
    issue.summary ||
    issue.message ||
    issue.description ||
    issue.details ||
    title
  );
}

function normalizeFix(issue) {
  return (
    issue.fix ||
    issue.recommendation ||
    issue.remediation ||
    issue.guidance ||
    issue.help ||
    issue.suggestion ||
    'Review the official Plugin Check output for remediation details.'
  );
}

function normalizeOrigin(issue) {
  return (
    issue.origin ||
    issue.check ||
    issue.check_name ||
    issue.code ||
    'official-plugin-check-import'
  );
}

function normalizeLocations(issue) {
  const location = issue.location || {};
  const file = issue.file || issue.path || issue.filename || location.file || location.path || '';
  const line = issue.line || issue.line_number || location.line || location.line_number || null;
  const column = issue.column || issue.column_number || location.column || location.column_number || null;
  const normalizedLine = Number.isFinite(Number(line)) ? Number(line) : null;
  const normalizedColumn = Number.isFinite(Number(column)) ? Number(column) : null;

  if (!file && normalizedLine === null && normalizedColumn === null) {
    return [];
  }

  return [
    {
      file,
      line: normalizedLine,
      column: normalizedColumn,
    },
  ];
}

function normalizeEvidenceLines(issue, summary) {
  const explicit = issue.evidence_lines || issue.evidence || issue.context || issue.examples;

  if (Array.isArray(explicit)) {
    return explicit.map((value) => String(value)).filter(Boolean);
  }

  if (explicit && typeof explicit === 'string') {
    return explicit.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  }

  const locations = normalizeLocations(issue);

  if (locations.length > 0) {
    return locations.map((location) => {
      const parts = [];
      if (location.file) {
        parts.push(location.file);
      }
      if (location.line !== null) {
        parts.push(String(location.line));
      }

      return parts.length > 0 ? `${parts.join(':')}: ${summary}` : summary;
    });
  }

  return summary ? [summary] : [];
}

function mapImportedIssue(issue) {
  const ruleId = normalizeRuleId(issue);
  const title = normalizeTitle(issue, ruleId);
  const summary = normalizeSummary(issue, title);
  const evidenceLines = normalizeEvidenceLines(issue, summary);

  return {
    severity: normalizeSeverity(issue.severity || issue.type || issue.level || issue.kind || issue.status),
    source: 'plugin_check',
    origin: normalizeOrigin(issue),
    rule_id: ruleId,
    title,
    summary,
    fix: normalizeFix(issue),
    evidence: evidenceLines.join('\n'),
    evidence_lines: evidenceLines,
    locations: normalizeLocations(issue),
  };
}

function collectIssuesFromChecks(checks) {
  const issues = [];

  for (const check of checks) {
    const base = {
      check: check.check || check.name || check.slug || check.id,
      check_name: check.title || check.name || check.check,
    };

    for (const issue of toArray(check.issues || check.results || check.findings || check.messages)) {
      issues.push({
        ...base,
        ...issue,
      });
    }
  }

  return issues;
}

function parsePluginCheckCliStream(contents) {
  const issues = [];
  const lines = contents.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.startsWith('FILE: ')) {
      continue;
    }

    const fileName = line.slice('FILE: '.length).trim();
    let payloadLine = '';

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (!lines[cursor].trim()) {
        continue;
      }

      payloadLine = lines[cursor];
      index = cursor;
      break;
    }

    if (!payloadLine) {
      continue;
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(payloadLine);
    } catch (_error) {
      continue;
    }

    for (const item of toArray(parsedItems)) {
      issues.push({
        ...item,
        file: item.file || fileName,
      });
    }
  }

  return issues;
}

function collectIssueCandidates(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload.checks)) {
    return collectIssuesFromChecks(payload.checks);
  }

  for (const key of ['findings', 'results', 'issues', 'messages', 'diagnostics']) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  if (payload.results && typeof payload.results === 'object') {
    const nestedResults = [];

    for (const value of Object.values(payload.results)) {
      if (Array.isArray(value)) {
        nestedResults.push(...value);
      }
    }

    if (nestedResults.length > 0) {
      return nestedResults;
    }
  }

  return [];
}

function detectPluginCheckReportFormat(filePath, contents) {
  const trimmed = contents.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'plugin_check_json';
  }

  if (contents.includes('FILE: ')) {
    return 'plugin_check_cli_json_stream';
  }

  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.json') {
    return 'plugin_check_json';
  }

  return 'plugin_check_cli_json_stream';
}

function importPluginCheckJson(reportPath, options = {}) {
  const maxBytes = options.maxBytes || DEFAULT_MAX_REPORT_BYTES;
  const allowedRoots = resolveAllowedRoots(options.allowedRoots || []);
  const { path: absolutePath } = assertFilePathAllowed(reportPath, allowedRoots, 'Plugin Check JSON report');
  const payload = readJson(absolutePath, maxBytes);
  const issues = collectIssueCandidates(payload);
  const findings = issues.map(mapImportedIssue);

  return {
    type: 'plugin_check_json',
    format: 'json',
    path: absolutePath,
    findings,
  };
}

function importPluginCheckCliStream(reportPath, options = {}) {
  const maxBytes = options.maxBytes || DEFAULT_MAX_REPORT_BYTES;
  const allowedRoots = resolveAllowedRoots(options.allowedRoots || []);
  const { path: absolutePath } = assertFilePathAllowed(reportPath, allowedRoots, 'Plugin Check report');
  const contents = readText(absolutePath, maxBytes);
  const issues = parsePluginCheckCliStream(contents);
  const findings = issues.map(mapImportedIssue);

  return {
    type: 'plugin_check_cli_json_stream',
    format: 'cli-json-stream',
    path: absolutePath,
    findings,
  };
}

function importPluginCheckReport(reportPath, options = {}) {
  const maxBytes = options.maxBytes || DEFAULT_MAX_REPORT_BYTES;
  const allowedRoots = resolveAllowedRoots(options.allowedRoots || []);
  const { path: absolutePath } = assertFilePathAllowed(reportPath, allowedRoots, 'Plugin Check report');
  const contents = readText(absolutePath, maxBytes);
  const format = detectPluginCheckReportFormat(absolutePath, contents);

  if (format === 'plugin_check_json') {
    return importPluginCheckJson(absolutePath, options);
  }

  return importPluginCheckCliStream(absolutePath, options);
}

function discoverPluginCheckReports(searchRoots, options = {}) {
  const allowedRoots = resolveAllowedRoots(options.allowedRoots || []);
  const maxDiscovered = options.maxDiscovered || DEFAULT_MAX_DISCOVERED_REPORTS;
  const discovered = new Set();

  for (const root of searchRoots) {
    let absoluteRoot;
    try {
      absoluteRoot = assertPathAllowed(root, allowedRoots, 'Plugin Check discovery root');
    } catch (_error) {
      continue;
    }

    if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {
      continue;
    }

    const children = fs.readdirSync(absoluteRoot, { withFileTypes: true });

    for (const child of children) {
      const fullPath = path.join(absoluteRoot, child.name);

      if (child.isFile() && REPORT_FILE_PATTERN.test(child.name)) {
        discovered.add(canonicalizePath(fullPath));
        if (discovered.size >= maxDiscovered) {
          return [...discovered].sort();
        }
        continue;
      }

      if (child.isDirectory() && REPORT_DIR_PATTERN.test(child.name)) {
        const nestedChildren = fs.readdirSync(fullPath, { withFileTypes: true });

        for (const nestedChild of nestedChildren) {
          if (!nestedChild.isFile() || !REPORT_FILE_PATTERN.test(nestedChild.name)) {
            continue;
          }

          discovered.add(canonicalizePath(path.join(fullPath, nestedChild.name)));
          if (discovered.size >= maxDiscovered) {
            return [...discovered].sort();
          }
        }
      }
    }
  }

  return [...discovered].sort();
}

module.exports = {
  discoverPluginCheckReports,
  importPluginCheckReport,
  importPluginCheckJson,
};
