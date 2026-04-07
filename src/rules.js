const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getRulesRoot(repoRoot) {
  return path.join(repoRoot, 'rules');
}

function loadIndexedRules(repoRoot) {
  const rulesRoot = getRulesRoot(repoRoot);
  const indexPath = path.join(rulesRoot, 'index.json');
  const index = readJson(indexPath);

  return index.rules.map((entry) => {
    const rulePath = path.join(rulesRoot, entry.path);
    const rule = readJson(rulePath);

    return {
      ...rule,
      file_path: rulePath,
      relative_path: entry.path,
    };
  });
}

function listRules(repoRoot, filters = {}) {
  return loadIndexedRules(repoRoot)
    .filter((rule) => {
      if (filters.category && rule.category !== filters.category) {
        return false;
      }

      if (filters.severity && rule.severity !== filters.severity) {
        return false;
      }

      if (filters.coverage && rule.coverage !== filters.coverage) {
        return false;
      }

      return true;
    })
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      coverage: rule.coverage,
      origin: rule.origin,
      relative_path: rule.relative_path,
    }));
}

function getRule(repoRoot, ruleId) {
  return loadIndexedRules(repoRoot).find((rule) => rule.id === ruleId) || null;
}

module.exports = {
  readJson,
  getRulesRoot,
  loadIndexedRules,
  listRules,
  getRule,
};
