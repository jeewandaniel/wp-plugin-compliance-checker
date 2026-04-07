const RED = '\u001b[0;31m';
const GREEN = '\u001b[0;32m';
const YELLOW = '\u001b[1;33m';
const BLUE = '\u001b[0;34m';
const NC = '\u001b[0m';

function colorForSeverity(severity) {
  switch (severity) {
    case 'error':
      return RED;
    case 'warning':
      return YELLOW;
    case 'advisory':
    case 'info':
      return BLUE;
    default:
      return NC;
  }
}

function resolveVerdict(report) {
  if (report.verdict) {
    return report.verdict;
  }

  return report.summary.errors === 0 && report.summary.warnings === 0
    ? 'ready_for_deeper_review'
    : 'needs_attention';
}

function renderFinding(finding) {
  const severityLabel = finding.severity.toUpperCase();
  const color = colorForSeverity(finding.severity);
  const lines = [];
  const sourceLabel = finding.source && finding.source !== 'project'
    ? ` [${String(finding.source).toUpperCase()}]`
    : '';

  lines.push(`${color}[${severityLabel}]${sourceLabel}${NC} ${finding.rule_id} - ${finding.title}`);
  lines.push(`  ${finding.summary}`);

  if (finding.evidence) {
    for (const evidenceLine of finding.evidence_lines.slice(0, 10)) {
      lines.push(`  ${evidenceLine}`);
    }
  }

  if (finding.fix) {
    lines.push(`  Fix: ${finding.fix}`);
  }

  lines.push('');
  return lines.join('\n');
}

function renderHumanReport(report) {
  const lines = [];
  const totalFindings = report.findings.length;
  const verdict = resolveVerdict(report);

  lines.push('==========================================');
  lines.push(' Rules-Driven Compliance Runner');
  lines.push('==========================================');
  lines.push('');
  lines.push(`Checking: ${report.plugin_dir}`);
  lines.push(`Rules index: ${report.rules_index}`);
  if (report.imports && report.imports.length > 0) {
    lines.push(`Imported Plugin Check reports: ${report.imports.length}`);
  }
  lines.push('');

  for (const finding of report.findings) {
    lines.push(renderFinding(finding));
  }

  lines.push('==========================================');
  lines.push(' SUMMARY');
  lines.push('==========================================');
  lines.push('');
  lines.push(`Errors: ${RED}${report.summary.errors}${NC}`);
  lines.push(`Warnings: ${YELLOW}${report.summary.warnings}${NC}`);
  lines.push(`Advisories: ${BLUE}${report.summary.advisories}${NC}`);
  lines.push(`Info: ${report.summary.info}`);
  lines.push('');
  lines.push(`Rules executed: ${report.summary.executed_rules}`);
  lines.push(`Rules skipped: ${report.summary.skipped_rules}`);
  if (report.sources) {
    lines.push(`Project findings: ${report.sources.project.findings}`);
    lines.push(`Imported Plugin Check findings: ${report.sources.plugin_check.findings}`);
  }
  lines.push('');

  if (verdict === 'ready_for_deeper_review' && totalFindings === 0) {
    lines.push(`${GREEN}No findings from executable rules.${NC}`);
  } else if (verdict === 'ready_for_deeper_review') {
    lines.push(`${GREEN}No error or warning findings were found. Review advisory and info findings as needed.${NC}`);
  } else {
    lines.push(`${YELLOW}Review findings above and continue with the official Plugin Check workflow.${NC}`);
  }

  return `${lines.join('\n')}\n`;
}

function renderMarkdownSection(report, severity, label) {
  const findings = report.findings.filter((finding) => finding.severity === severity);

  if (findings.length === 0) {
    return '';
  }

  const lines = [];
  lines.push(`## ${label}`);
  lines.push('');

  for (const finding of findings) {
    lines.push(`### ${finding.title}`);
    lines.push('');
    lines.push(`- Rule ID: \`${finding.rule_id}\``);
    lines.push(`- Source: ${finding.source || 'project'}`);
    lines.push(`- Summary: ${finding.summary}`);
    lines.push(`- Fix: ${finding.fix}`);

    if (finding.evidence_lines.length > 0) {
      lines.push('- Evidence:');
      for (const evidenceLine of finding.evidence_lines) {
        lines.push(`  - ${evidenceLine}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

function renderMarkdownReport(report) {
  const lines = [];
  const totalFindings = report.findings.length;
  const verdict = resolveVerdict(report);

  lines.push('# WordPress.org Compliance Report');
  lines.push('');
  lines.push(`- Tool: \`${report.tool}\``);
  lines.push(`- Plugin directory: \`${report.plugin_dir}\``);
  lines.push(`- Generated at: \`${report.generated_at}\``);
  lines.push(`- Verdict: \`${verdict}\``);
  lines.push(`- Errors: ${report.summary.errors}`);
  lines.push(`- Warnings: ${report.summary.warnings}`);
  lines.push(`- Advisories: ${report.summary.advisories}`);
  lines.push(`- Executed rules: ${report.summary.executed_rules}`);
  lines.push(`- Skipped rules: ${report.summary.skipped_rules}`);
  if (report.sources) {
    lines.push(`- Project findings: ${report.sources.project.findings}`);
    lines.push(`- Imported Plugin Check findings: ${report.sources.plugin_check.findings}`);
  }
  lines.push('');
  lines.push('## Verdict');
  lines.push('');

  if (verdict === 'ready_for_deeper_review' && totalFindings === 0) {
    lines.push('Ready for deeper review. No executable-rule errors or warnings were found in this scan.');
  } else if (verdict === 'ready_for_deeper_review') {
    lines.push('Ready for deeper review. No error or warning findings were found, but advisory or informational findings are still worth reviewing.');
  } else {
    lines.push('Not review-ready yet. Address the findings below and then re-run the scan plus the official Plugin Check workflow.');
  }

  lines.push('');

  for (const section of [
    renderMarkdownSection(report, 'error', 'Errors'),
    renderMarkdownSection(report, 'warning', 'Warnings'),
    renderMarkdownSection(report, 'advisory', 'Advisories'),
    renderMarkdownSection(report, 'info', 'Info'),
  ]) {
    if (section) {
      lines.push(section);
    }
  }

  return `${lines.join('\n')}\n`;
}

module.exports = {
  renderHumanReport,
  renderMarkdownReport,
};
