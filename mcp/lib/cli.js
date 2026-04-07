const { scanPlugin } = require('../../src/engine');
const { renderMarkdownReport } = require('../../src/report');

function runScan(repoRoot, pluginPath, options = {}) {
  return scanPlugin(repoRoot, pluginPath, {
    runnerLabel: 'mcp.scan_plugin',
    allowedRoots: options.allowedRoots || [],
    pluginCheckJsonPaths: options.pluginCheckJsonPaths || [],
    pluginCheckReportPaths: options.pluginCheckReportPaths || [],
    pluginCheckAuto: options.pluginCheckAuto || false,
  });
}

function renderMarkdown(repoRoot, report) {
  return renderMarkdownReport(report);
}

module.exports = {
  runScan,
  renderMarkdown,
};
