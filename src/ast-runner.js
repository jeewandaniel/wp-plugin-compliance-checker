/**
 * AST-based PHP analysis using php-parser.
 *
 * This module provides context-aware detection that can distinguish between:
 * - Actual function calls vs. strings/comments containing function names
 * - Code in different contexts (class methods, closures, global scope)
 * - Variable usage patterns
 *
 * php-parser is an optional dependency. If not installed, AST-based rules
 * will be skipped and fall back to regex detection.
 */

let phpParser = null;
let parserAvailable = false;

// Try to load php-parser
try {
  phpParser = require('php-parser');
  parserAvailable = true;
} catch (_error) {
  // php-parser not installed - AST features disabled
}

/**
 * Check if AST parsing is available.
 * @returns {boolean}
 */
function isAstAvailable() {
  return parserAvailable;
}

/**
 * Create a PHP parser instance.
 * @returns {Object|null} Parser instance or null if unavailable
 */
function createParser() {
  if (!parserAvailable) {
    return null;
  }

  return new phpParser.Engine({
    parser: {
      extractDoc: true,
      php7: true,
      locations: true,
      suppressErrors: true,
    },
    ast: {
      withPositions: true,
      withSource: true,
    },
  });
}

/**
 * Parse PHP code into an AST.
 * @param {string} code - PHP source code
 * @param {string} filename - Filename for error reporting
 * @returns {Object|null} AST or null on parse error
 */
function parseCode(code, filename = 'unknown.php') {
  const parser = createParser();
  if (!parser) {
    return null;
  }

  try {
    return parser.parseCode(code, filename);
  } catch (_error) {
    // Parse error - return null to fall back to regex
    return null;
  }
}

/**
 * Recursively walk an AST and collect nodes matching a predicate.
 * @param {Object} node - AST node
 * @param {Function} predicate - Function that returns true for matching nodes
 * @param {Array} results - Accumulator for results
 * @returns {Array} Matching nodes
 */
function walkAst(node, predicate, results = []) {
  if (!node || typeof node !== 'object') {
    return results;
  }

  if (predicate(node)) {
    results.push(node);
  }

  // Walk children
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        walkAst(item, predicate, results);
      }
    } else if (child && typeof child === 'object') {
      walkAst(child, predicate, results);
    }
  }

  return results;
}

/**
 * Find all function calls in an AST.
 * @param {Object} ast - Parsed AST
 * @param {string[]} functionNames - Function names to find
 * @returns {Array} Array of {name, line, column, context}
 */
function findFunctionCalls(ast, functionNames) {
  const nameSet = new Set(functionNames.map(n => n.toLowerCase()));
  const results = [];

  walkAst(ast, (node) => {
    // Direct function call: func()
    if (node.kind === 'call' && node.what) {
      let name = null;

      if (node.what.kind === 'name') {
        name = node.what.name;
      } else if (node.what.kind === 'identifier') {
        name = node.what.name;
      }

      if (name && nameSet.has(name.toLowerCase())) {
        results.push({
          name,
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          kind: 'call',
        });
        return true;
      }
    }

    // Static method call: Class::method()
    if (node.kind === 'staticcall' && node.what) {
      const name = node.what.name;
      if (name && nameSet.has(name.toLowerCase())) {
        results.push({
          name,
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          kind: 'staticcall',
        });
        return true;
      }
    }

    return false;
  });

  return results;
}

/**
 * Find all variable accesses (like $_POST, $_GET).
 * @param {Object} ast - Parsed AST
 * @param {string[]} variableNames - Variable names to find (without $)
 * @returns {Array} Array of {name, line, column}
 */
function findVariableAccesses(ast, variableNames) {
  const nameSet = new Set(variableNames.map(n => n.replace(/^\$/, '')));
  const results = [];

  walkAst(ast, (node) => {
    if (node.kind === 'variable' && node.name) {
      const name = typeof node.name === 'string' ? node.name : node.name.name;
      if (name && nameSet.has(name)) {
        results.push({
          name: `$${name}`,
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          kind: 'variable',
        });
        return true;
      }
    }

    // Also check offsetlookup for $_POST['key'] style access
    if (node.kind === 'offsetlookup' && node.what?.kind === 'variable') {
      const name = typeof node.what.name === 'string' ? node.what.name : node.what.name?.name;
      if (name && nameSet.has(name)) {
        results.push({
          name: `$${name}`,
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          kind: 'offsetlookup',
        });
        return true;
      }
    }

    return false;
  });

  return results;
}

/**
 * Find string literals containing specific patterns.
 * This helps identify false positives where function names appear in strings.
 * @param {Object} ast - Parsed AST
 * @param {string[]} patterns - Patterns to find in strings
 * @returns {Array} Array of {value, line, column}
 */
function findStringsContaining(ast, patterns) {
  const results = [];

  walkAst(ast, (node) => {
    if (node.kind === 'string' && node.value) {
      const value = String(node.value);
      for (const pattern of patterns) {
        if (value.includes(pattern)) {
          results.push({
            value,
            pattern,
            line: node.loc?.start?.line || 0,
            column: node.loc?.start?.column || 0,
            kind: 'string',
          });
          return true;
        }
      }
    }
    return false;
  });

  return results;
}

/**
 * Run AST-based detection for a rule.
 * @param {Object} rule - Rule definition with detection.ast_query
 * @param {string} code - PHP source code
 * @param {string} filePath - File path for error reporting
 * @returns {Object} {skipped: boolean, evidenceLines: string[]}
 */
function runAstDetection(rule, code, filePath) {
  if (!parserAvailable) {
    return { skipped: true, evidenceLines: [], reason: 'php-parser not installed' };
  }

  const ast = parseCode(code, filePath);
  if (!ast) {
    return { skipped: true, evidenceLines: [], reason: 'parse error' };
  }

  const detection = rule.detection || {};
  const astQuery = detection.ast_query || {};
  const evidenceLines = [];

  // Handle function call detection
  if (astQuery.type === 'function_call' && astQuery.functions) {
    const calls = findFunctionCalls(ast, astQuery.functions);
    for (const call of calls) {
      evidenceLines.push(`${filePath}:${call.line}:${call.name}() call detected via AST`);
    }
  }

  // Handle variable access detection
  if (astQuery.type === 'variable_access' && astQuery.variables) {
    const accesses = findVariableAccesses(ast, astQuery.variables);
    for (const access of accesses) {
      evidenceLines.push(`${filePath}:${access.line}:${access.name} access detected via AST`);
    }
  }

  return { skipped: false, evidenceLines };
}

/**
 * Analyze a PHP file and return structured findings.
 * @param {string} code - PHP source code
 * @param {string} filePath - File path
 * @returns {Object|null} Analysis results or null if parsing fails
 */
function analyzePhpFile(code, filePath) {
  if (!parserAvailable) {
    return null;
  }

  const ast = parseCode(code, filePath);
  if (!ast) {
    return null;
  }

  return {
    filePath,
    ast,
    functionCalls: (names) => findFunctionCalls(ast, names),
    variableAccesses: (names) => findVariableAccesses(ast, names),
    stringsContaining: (patterns) => findStringsContaining(ast, patterns),
  };
}

module.exports = {
  isAstAvailable,
  createParser,
  parseCode,
  walkAst,
  findFunctionCalls,
  findVariableAccesses,
  findStringsContaining,
  runAstDetection,
  analyzePhpFile,
};
