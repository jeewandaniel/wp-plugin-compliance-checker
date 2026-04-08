/**
 * Auto-fix handler registry.
 *
 * Each handler is a function that takes:
 *   (finding, rule, limits, safeReadText) => number of files fixed
 *
 * To add a new fixer:
 *   1. Create a new file in this directory (e.g., whitespace.js)
 *   2. Export a function with the signature above
 *   3. Register it in the handlers object below
 *   4. Reference it in a rule's guidance.auto_fix.handler field
 */

const casingFixer = require('./casing');

const handlers = {
  casing: casingFixer,
  // Future handlers:
  // whitespace: require('./whitespace'),
  // deprecated: require('./deprecated'),
};

/**
 * Run the appropriate fixer for a finding.
 *
 * @param {string} handlerName - Name of the handler from rule.guidance.auto_fix.handler
 * @param {Object} finding - The finding object
 * @param {Object} rule - The rule definition
 * @param {Object} limits - Scan limits
 * @param {Function} safeReadText - Function to safely read file contents
 * @returns {number} Number of files fixed, or 0 if handler not found
 */
function runFixer(handlerName, finding, rule, limits, safeReadText) {
  const handler = handlers[handlerName];
  if (!handler) {
    return 0;
  }
  return handler(finding, rule, limits, safeReadText);
}

/**
 * Register a custom fixer handler.
 *
 * @param {string} name - Handler name
 * @param {Function} handler - Handler function
 */
function registerHandler(name, handler) {
  handlers[name] = handler;
}

/**
 * Get list of available handler names.
 *
 * @returns {string[]} Array of handler names
 */
function listHandlers() {
  return Object.keys(handlers);
}

module.exports = {
  runFixer,
  registerHandler,
  listHandlers,
};
