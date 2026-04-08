const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadIndexedRules } = require('./rules');
const { discoverPluginCheckReports, importPluginCheckReport } = require('./importers');
const {
  assertPathAllowed,
  canonicalizePath,
  resolveAllowedRoots,
} = require('./security');
const { runFixer } = require('./fixers');

const SKIPPED_COVERAGE = new Set(['delegated', 'docs-only', 'planned']);
const DEFAULT_SCAN_FILE_BYTES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_SCAN_FILE_BYTES || 1024 * 1024);
const DEFAULT_SCAN_ENTRIES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_SCAN_ENTRIES || 10000);
const DEFAULT_IMPORT_REPORT_BYTES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_IMPORT_REPORT_BYTES || 5 * 1024 * 1024);
const DEFAULT_ZIP_FILE_BYTES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_ZIP_FILE_BYTES || 25 * 1024 * 1024);
const DEFAULT_ZIP_ENTRIES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_ZIP_ENTRIES || 5000);
const DEFAULT_EXTRACTED_BYTES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_EXTRACTED_BYTES || 100 * 1024 * 1024);
const DEFAULT_UNZIP_TIMEOUT_MS = Number(process.env.WP_PLUGIN_COMPLIANCE_UNZIP_TIMEOUT_MS || 15000);
const DEFAULT_COMMAND_BUFFER_BYTES = Number(process.env.WP_PLUGIN_COMPLIANCE_MAX_COMMAND_BUFFER_BYTES || 5 * 1024 * 1024);

function basenameMatches(globs, fileName) {
  return globs.some((glob) => {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped.replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
    return regex.test(fileName);
  });
}

function normalizeExtendedRegex(pattern) {
  return pattern
    .replace(/\[\[:space:\]\]/g, '\\s')
    .replace(/\[\[:blank:\]\]/g, '[ \\t]')
    .replace(/\[\[:digit:\]\]/g, '\\d');
}

function safeReadText(filePath, limits) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > limits.maxScanFileBytes) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (_error) {
    return '';
  }
}

function splitLines(contents) {
  return contents.split(/\r?\n/);
}

function uniqueLines(lines) {
  return [...new Set(lines.filter(Boolean))];
}

function walkEntries(rootDir, limits) {
  const entries = [];
  const stack = [rootDir];

  let ignoreGlobs = ['.git', 'node_modules'];
  try {
    const ignorePath = path.join(rootDir, '.wpignore');
    if (fs.existsSync(ignorePath)) {
      const content = fs.readFileSync(ignorePath, 'utf8');
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      ignoreGlobs = ignoreGlobs.concat(lines);
    }
  } catch (err) {
    // ignore errors reading .wpignore
  }

  while (stack.length > 0) {
    const current = stack.pop();
    const children = fs.readdirSync(current, { withFileTypes: true });

    for (const child of children) {
      if (basenameMatches(ignoreGlobs, child.name)) {
        continue;
      }
      const fullPath = path.join(current, child.name);
      if (entries.length >= limits.maxScanEntries) {
        throw new Error(`Scan aborted because the directory exceeds ${limits.maxScanEntries} entries.`);
      }
      const entry = {
        path: fullPath,
        name: child.name,
        isFile: child.isFile(),
        isDirectory: child.isDirectory(),
      };

      entries.push(entry);

      if (child.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

function collectFilesByGlobs(entries, globs) {
  return entries
    .filter((entry) => entry.isFile && basenameMatches(globs, entry.name))
    .map((entry) => entry.path);
}

function collectPathsByGlobs(entries, globs) {
  return entries
    .filter((entry) => basenameMatches(globs, entry.name))
    .map((entry) => entry.path);
}

function createMatcher(pattern, mode) {
  if (mode === 'extended-regex') {
    const regex = new RegExp(normalizeExtendedRegex(pattern));
    return (line) => regex.test(line);
  }

  return (line) => line.includes(pattern);
}

function findPatternEvidence(files, patterns, patternMode, limits, ignoreComments = false) {
  const matchers = patterns.map((pattern) => createMatcher(pattern, patternMode));
  const evidence = [];

  for (const filePath of files) {
    const contents = safeReadText(filePath, limits);
    const lines = splitLines(contents);

    lines.forEach((line, index) => {
      if (ignoreComments && /^\s*(?:\/\/|\*|#)/.test(line)) {
        return;
      }
      if (matchers.some((matcher) => matcher(line))) {
        evidence.push(`${filePath}:${index + 1}:${line}`);
      }
    });
  }

  return uniqueLines(evidence);
}

function findPluginVersion(scanPath, limits) {
  const topLevelEntries = fs.readdirSync(scanPath, { withFileTypes: true });
  const topLevelPhp = topLevelEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.php'))
    .map((entry) => path.join(scanPath, entry.name));

  for (const phpFile of topLevelPhp) {
    const contents = safeReadText(phpFile, limits);
    const match = contents.match(/^[\s*]*Version:\s*(.+)$/im);

    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

function runStableTagRule(scanPath, rule, limits) {
  const readmePath = path.join(scanPath, 'readme.txt');

  if (!fs.existsSync(readmePath)) {
    return [readmePath + ' missing'];
  }

  const readmeContents = safeReadText(readmePath, limits);
  const stableTagMatch = readmeContents.match(/^Stable tag:\s*(.+)$/im);
  const stableTag = stableTagMatch ? stableTagMatch[1].trim() : '';
  const pluginVersion = findPluginVersion(scanPath, limits);
  const evidence = [];

  if (stableTag === 'trunk') {
    evidence.push('Stable tag: trunk');
  } else if (!stableTag) {
    evidence.push('Stable tag missing from readme.txt');
  } else if (!pluginVersion) {
    evidence.push('Could not determine plugin header version');
  } else if (stableTag !== pluginVersion) {
    evidence.push(`readme.txt Stable tag: ${stableTag}`);
    evidence.push(`Plugin header Version: ${pluginVersion}`);
  }

  return evidence;
}

function runReadmeTagLimitRule(scanPath, limits) {
  const readmePath = path.join(scanPath, 'readme.txt');

  if (!fs.existsSync(readmePath)) {
    return [];
  }

  const readmeContents = safeReadText(readmePath, limits);
  const tagsMatch = readmeContents.match(/^Tags:\s*(.+)$/im);

  if (!tagsMatch) {
    return [];
  }

  const tagsLine = `Tags: ${tagsMatch[1].trim()}`;
  const tagCount = tagsMatch[1]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean).length;

  if (tagCount > 5) {
    return [`Tag count: ${tagCount}`, tagsLine];
  }

  return [];
}

function runDirectFileAccessRule(entries, limits) {
  const evidence = [];

  for (const filePath of collectFilesByGlobs(entries, ['*.php'])) {
    const snippet = splitLines(safeReadText(filePath, limits)).slice(0, 20).join('\n');

    if (!/ABSPATH|WPINC/.test(snippet)) {
      evidence.push(filePath);
    }
  }

  return uniqueLines(evidence);
}

function runRule(rule, context) {
  const { entries, scanPath, limits } = context;
  const detection = rule.detection || {};
  const strategy = detection.strategy || '';
  const fileGlobs = detection.file_globs || [];
  const patterns = detection.patterns || [];
  const patternMode = detection.pattern_mode || 'fixed';
  const ignoreComments = !!detection.ignore_comments;

  if (SKIPPED_COVERAGE.has(rule.coverage)) {
    return { skipped: true, evidenceLines: [] };
  }

  switch (strategy) {
    case 'regex':
    case 'composite': {
      if (fileGlobs.length === 0 || patterns.length === 0) {
        return { skipped: true, evidenceLines: [] };
      }

      const files = collectFilesByGlobs(entries, fileGlobs);
      const evidenceLines = files.length > 0 ? findPatternEvidence(files, patterns, patternMode, limits, ignoreComments) : [];
      return { skipped: false, evidenceLines };
    }

    case 'glob': {
      if (fileGlobs.length === 0) {
        return { skipped: true, evidenceLines: [] };
      }

      return {
        skipped: false,
        evidenceLines: uniqueLines(collectPathsByGlobs(entries, fileGlobs)),
      };
    }

    case 'metadata': {
      switch (detection.metadata_check) {
        case 'stable-tag-consistency':
          return { skipped: false, evidenceLines: runStableTagRule(scanPath, rule, limits) };
        case 'readme-tag-limit':
          return { skipped: false, evidenceLines: runReadmeTagLimitRule(scanPath, limits) };
        case 'direct-file-access':
          return { skipped: false, evidenceLines: runDirectFileAccessRule(entries, limits) };
        default:
          return { skipped: true, evidenceLines: [] };
      }
    }

    case 'paired-files': {
      const minFiles = collectFilesByGlobs(entries, detection.file_globs || []);
      const evidence = [];

      for (const minFile of minFiles) {
        const sourceFileJs = minFile.replace(/\.min\.js$/, '.js');
        const sourceFileCss = minFile.replace(/\.min\.css$/, '.css');
        if (minFile.endsWith('.min.js') && !fs.existsSync(sourceFileJs)) {
          evidence.push(minFile + ' (missing matching .js source)');
        }
        if (minFile.endsWith('.min.css') && !fs.existsSync(sourceFileCss)) {
          evidence.push(minFile + ' (missing matching .css source)');
        }
      }
      return { skipped: false, evidenceLines: evidence };
    }

    default:
      return { skipped: true, evidenceLines: [] };
  }
}

function buildFinding(rule, evidenceLines) {
  return {
    severity: rule.severity,
    source: 'project',
    origin: rule.origin || 'project-rule',
    rule_id: rule.id,
    title: rule.title,
    summary: rule.summary,
    fix: rule.guidance && rule.guidance.fix ? rule.guidance.fix : '',
    evidence: evidenceLines.join('\n'),
    evidence_lines: evidenceLines,
    locations: [],
  };
}

function runAutoFixHandlers(findings, rules, limits) {
  let fixedCount = 0;
  for (const finding of findings) {
    const rule = rules.find(r => r.id === finding.rule_id);
    if (!rule || !rule.guidance || !rule.guidance.auto_fix || !rule.guidance.auto_fix.available) {
      continue;
    }

    const handlerName = rule.guidance.auto_fix.handler;
    if (handlerName) {
      fixedCount += runFixer(handlerName, finding, rule, limits, safeReadText);
    }
  }
  return fixedCount;
}

function pickExtractedScanRoot(extractRoot) {
  const entries = fs.readdirSync(extractRoot, { withFileTypes: true }).filter((entry) => entry.name !== '__MACOSX');

  if (entries.length === 1 && entries[0].isDirectory()) {
    return path.join(extractRoot, entries[0].name);
  }

  return extractRoot;
}

function archiveEntryIsUnsafe(entryPath) {
  if (!entryPath) {
    return false;
  }

  if (/^(\/|\\|[a-zA-Z]:[\\/])/.test(entryPath)) {
    return true;
  }

  const normalizedPath = path.posix.normalize(entryPath.replace(/\\/g, '/'));
  return normalizedPath === '..' || normalizedPath.startsWith('../') || normalizedPath.includes('/../');
}

function listZipEntries(zipPath, limits) {
  const result = spawnSync('unzip', ['-Z1', zipPath], {
    encoding: 'utf8',
    timeout: limits.unzipTimeoutMs,
    maxBuffer: limits.maxCommandBufferBytes,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(result.stderr || 'Failed to inspect plugin ZIP archive.');
  }

  const entries = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (entries.length > limits.maxZipEntries) {
    throw new Error(`ZIP archive exceeds entry limit (${entries.length} > ${limits.maxZipEntries}).`);
  }

  for (const entry of entries) {
    if (archiveEntryIsUnsafe(entry)) {
      throw new Error(`ZIP archive contains an unsafe path: ${entry}`);
    }
  }

  return entries;
}

function measureTree(rootDir, limits) {
  const stack = [rootDir];
  let entryCount = 0;
  let totalBytes = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    const children = fs.readdirSync(current, { withFileTypes: true });

    for (const child of children) {
      const fullPath = path.join(current, child.name);
      entryCount += 1;

      if (entryCount > limits.maxScanEntries) {
        throw new Error(`Extracted archive exceeds entry limit (${limits.maxScanEntries}).`);
      }

      if (child.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (child.isFile()) {
        totalBytes += fs.statSync(fullPath).size;
        if (totalBytes > limits.maxExtractedBytes) {
          throw new Error(`Extracted archive exceeds size limit (${limits.maxExtractedBytes} bytes).`);
        }
      }
    }
  }
}

function prepareScanTarget(targetPath, options = {}) {
  const allowedRoots = resolveAllowedRoots(options.allowedRoots || []);
  const limits = options.limits;
  const absoluteTargetPath = assertPathAllowed(targetPath, allowedRoots, 'Scan target');

  if (!fs.existsSync(absoluteTargetPath)) {
    throw new Error(`Path not found: ${absoluteTargetPath}`);
  }

  const stats = fs.statSync(absoluteTargetPath);

  if (stats.isDirectory()) {
    return {
      inputPath: absoluteTargetPath,
      scanPath: absoluteTargetPath,
      cleanup() {},
    };
  }

  if (stats.isFile() && absoluteTargetPath.endsWith('.zip')) {
    if (stats.size > limits.maxZipFileBytes) {
      throw new Error(`ZIP archive exceeds size limit (${stats.size} bytes).`);
    }

    listZipEntries(absoluteTargetPath, limits);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-plugin-compliance-'));
    const unzipResult = spawnSync('unzip', ['-qq', absoluteTargetPath, '-d', tempRoot], {
      encoding: 'utf8',
      timeout: limits.unzipTimeoutMs,
      maxBuffer: limits.maxCommandBufferBytes,
    });

    if (unzipResult.error) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
      throw unzipResult.error;
    }

    if (typeof unzipResult.status === 'number' && unzipResult.status !== 0) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
      throw new Error(unzipResult.stderr || 'Failed to extract plugin ZIP archive.');
    }

    measureTree(tempRoot, limits);

    return {
      inputPath: absoluteTargetPath,
      scanPath: pickExtractedScanRoot(tempRoot),
      cleanup() {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      },
    };
  }

  throw new Error(`Unsupported scan target: ${absoluteTargetPath}`);
}

function summarizeFindings(findings) {
  const summary = {
    errors: 0,
    warnings: 0,
    advisories: 0,
    info: 0,
  };

  for (const finding of findings) {
    switch (finding.severity) {
      case 'error':
        summary.errors += 1;
        break;
      case 'warning':
        summary.warnings += 1;
        break;
      case 'advisory':
        summary.advisories += 1;
        break;
      case 'info':
        summary.info += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

function createSummarySkeleton() {
  return {
    errors: 0,
    warnings: 0,
    advisories: 0,
    info: 0,
    executed_rules: 0,
    skipped_rules: 0,
  };
}

function addFindingToSummary(summary, finding) {
  switch (finding.severity) {
    case 'error':
      summary.errors += 1;
      break;
    case 'warning':
      summary.warnings += 1;
      break;
    case 'advisory':
      summary.advisories += 1;
      break;
    case 'info':
      summary.info += 1;
      break;
    default:
      break;
  }
}

function summarizeSource(findings) {
  const counts = summarizeFindings(findings);
  return {
    findings: findings.length,
    ...counts,
  };
}

function scanPlugin(repoRoot, targetPath, options = {}) {
  const runnerLabel = options.runnerLabel || 'src/engine';
  const pluginCheckJsonPaths = options.pluginCheckJsonPaths || [];
  const pluginCheckReportPaths = options.pluginCheckReportPaths || [];
  const pluginCheckAuto = options.pluginCheckAuto || false;
  const runWpCli = options.runWpCli || false;
  const allowedRoots = resolveAllowedRoots(options.allowedRoots || []);
  const limits = {
    maxScanFileBytes: DEFAULT_SCAN_FILE_BYTES,
    maxScanEntries: DEFAULT_SCAN_ENTRIES,
    maxImportReportBytes: DEFAULT_IMPORT_REPORT_BYTES,
    maxZipFileBytes: DEFAULT_ZIP_FILE_BYTES,
    maxZipEntries: DEFAULT_ZIP_ENTRIES,
    maxExtractedBytes: DEFAULT_EXTRACTED_BYTES,
    unzipTimeoutMs: DEFAULT_UNZIP_TIMEOUT_MS,
    maxCommandBufferBytes: DEFAULT_COMMAND_BUFFER_BYTES,
    ...(options.limits || {}),
  };
  const target = prepareScanTarget(targetPath, { allowedRoots, limits });
  let autoWpCliPath = null;

  try {
    const rules = loadIndexedRules(repoRoot);
    const entries = walkEntries(target.scanPath, limits);
    const context = {
      scanPath: target.scanPath,
      entries,
      limits,
    };
    const projectFindings = [];
    const summary = createSummarySkeleton();

    for (const rule of rules) {
      const result = runRule(rule, context);

      if (result.skipped) {
        summary.skipped_rules += 1;
        continue;
      }

      summary.executed_rules += 1;

      if (result.evidenceLines.length > 0) {
        const finding = buildFinding(rule, result.evidenceLines);
        projectFindings.push(finding);
        addFindingToSummary(summary, finding);
      }
    }

    if (options.autoFix && projectFindings.length > 0) {
      const fixCount = runAutoFixHandlers(projectFindings, rules, limits);
      if (fixCount > 0) {
        summary.info += 1; // Log that files were modified
        projectFindings.push({
          severity: 'info',
          source: 'project',
          origin: 'project-rule',
          rule_id: 'auto_fix',
          title: 'Files modified automatically',
          summary: `The engine auto-patched ${fixCount} files based on fast-fix guidance.`,
          fix: '',
          evidence: `Modified ${fixCount} matching paths.`,
          evidence_lines: [],
          locations: [],
        });
      }
    }

    if (runWpCli) {
      const wpResult = spawnSync('wp', ['plugin', 'check', target.inputPath, '--format=json'], {
        encoding: 'utf8',
        maxBuffer: limits.maxCommandBufferBytes,
      });

      if (wpResult.error && wpResult.error.code === 'ENOENT') {
        throw new Error('WP-CLI is not installed or not in PATH, but --run-wp-cli was requested.');
      }

      autoWpCliPath = path.join(os.tmpdir(), `wp-plugin-compliance-wpcli-${Date.now()}.json`);
      fs.writeFileSync(autoWpCliPath, wpResult.stdout || '');
    }

    const candidateImportPaths = [
      ...pluginCheckReportPaths,
      ...pluginCheckJsonPaths,
      ...(autoWpCliPath ? [autoWpCliPath] : []),
      ...(pluginCheckAuto
        ? discoverPluginCheckReports([
            path.dirname(target.inputPath),
            process.cwd(),
            repoRoot,
          ], {
            allowedRoots,
          })
        : []),
    ];
    const uniqueImportPaths = [...new Set(candidateImportPaths.map((reportPath) => canonicalizePath(reportPath)))];
    const imports = uniqueImportPaths.map((reportPath) => importPluginCheckReport(reportPath, {
      allowedRoots,
      maxBytes: limits.maxImportReportBytes,
    }));
    const importedFindings = imports.flatMap((entry) => entry.findings);

    for (const finding of importedFindings) {
      addFindingToSummary(summary, finding);
    }

    const findings = [...projectFindings, ...importedFindings];
    const sources = {
      project: summarizeSource(projectFindings),
      plugin_check: summarizeSource(importedFindings),
    };

    const report = {
      tool: 'wp-plugin-compliance-checker',
      runner: runnerLabel,
      format_version: 1,
      plugin_dir: target.inputPath,
      rules_index: path.join(repoRoot, 'rules', 'index.json'),
      generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      verdict: summary.errors === 0 && summary.warnings === 0 ? 'ready_for_deeper_review' : 'needs_attention',
      summary,
      findings,
      sources,
      imports: imports.map((entry) => ({
        type: entry.type,
        format: entry.format,
        path: entry.path,
        findings: entry.findings.length,
      })),
    };

    return {
      exitCode: report.summary.errors,
      report,
    };
  } finally {
    if (autoWpCliPath && fs.existsSync(autoWpCliPath)) {
      try {
        fs.unlinkSync(autoWpCliPath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    target.cleanup();
  }
}

module.exports = {
  scanPlugin,
};
