// Runs npm the same way on every platform. On Windows npm is `npm.cmd`, which Node starts only
// through a shell; elsewhere npm starts directly. `npm exec -- <bin>` stands in for npx.

import { execFileSync, spawn } from 'node:child_process';

const shell = process.platform === 'win32';

/**
 * Runs npm and waits for it. Returns its standard output as text unless `stdio` sends it elsewhere,
 * and throws, with the exit `status`, when npm fails.
 */
export function runNpm(args, options = {}) {
  return execFileSync('npm', args, { encoding: 'utf8', ...options, shell });
}

/** Starts npm without waiting for it, and returns the child process. */
export function startNpm(args, options = {}) {
  return spawn('npm', args, { ...options, shell });
}
