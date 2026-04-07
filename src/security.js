const fs = require('node:fs');
const path = require('node:path');

function canonicalizePath(candidatePath) {
  const absolutePath = path.resolve(candidatePath);

  try {
    return fs.realpathSync.native(absolutePath);
  } catch (_error) {
    return absolutePath;
  }
}

function resolveAllowedRoots(explicitRoots = []) {
  return [...new Set((explicitRoots || []).filter(Boolean).map((root) => canonicalizePath(root)))];
}

function isPathInsideRoot(candidatePath, rootPath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function assertPathAllowed(candidatePath, allowedRoots = [], label = 'Path') {
  const canonicalPath = canonicalizePath(candidatePath);

  if (!allowedRoots || allowedRoots.length === 0) {
    return canonicalPath;
  }

  if (allowedRoots.some((rootPath) => isPathInsideRoot(canonicalPath, rootPath))) {
    return canonicalPath;
  }

  throw new Error(`${label} must stay within allowed roots: ${canonicalPath}`);
}

function assertExistingPath(candidatePath, label = 'Path') {
  if (!fs.existsSync(candidatePath)) {
    throw new Error(`${label} does not exist: ${candidatePath}`);
  }

  return fs.statSync(candidatePath);
}

function assertFilePathAllowed(candidatePath, allowedRoots = [], label = 'File path') {
  const canonicalPath = assertPathAllowed(candidatePath, allowedRoots, label);
  const stat = assertExistingPath(canonicalPath, label);

  if (!stat.isFile()) {
    throw new Error(`${label} is not a file: ${canonicalPath}`);
  }

  return {
    path: canonicalPath,
    stat,
  };
}

function assertDirectoryPathAllowed(candidatePath, allowedRoots = [], label = 'Directory path') {
  const canonicalPath = assertPathAllowed(candidatePath, allowedRoots, label);
  const stat = assertExistingPath(canonicalPath, label);

  if (!stat.isDirectory()) {
    throw new Error(`${label} is not a directory: ${canonicalPath}`);
  }

  return {
    path: canonicalPath,
    stat,
  };
}

function sanitizeControlChars(value) {
  return String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

module.exports = {
  canonicalizePath,
  resolveAllowedRoots,
  assertPathAllowed,
  assertFilePathAllowed,
  assertDirectoryPathAllowed,
  sanitizeControlChars,
};
