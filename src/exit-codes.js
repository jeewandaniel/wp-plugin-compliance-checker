/**
 * Standardized exit codes for the compliance checker.
 *
 * These codes allow CI systems to distinguish between different
 * outcomes without parsing output.
 */
module.exports = {
  /** Clean scan, no errors or warnings */
  SUCCESS: 0,

  /** Findings exist (at least one error found) */
  FINDINGS_EXIST: 1,

  /** Scan failed due to invalid path, ZIP error, or similar */
  SCAN_ERROR: 2,

  /** Invalid configuration or arguments */
  CONFIG_ERROR: 3,

  /** Scan timed out */
  TIMEOUT: 4,
};
