#!/usr/bin/env node
// Runs every check of `npm run check`. The checks of a stage run side by side and print their
// output once each finishes; a stage starts only when every check of the one before it passed.
// The unit tests use every core, so they run beside only the light checks that need the builds.

import { spawn } from 'node:child_process';

const STAGES = [
  [
    'lint',
    'format:check',
    'typecheck',
    'check:references',
    'check:specs',
    'check:labs',
    'check:structure',
    'build',
    'build:labs',
  ],
  ['test', 'check:public-types', 'check:package'],
];

function run(script) {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', '--silent', script], {
      env: process.stdout.isTTY ? { ...process.env, FORCE_COLOR: '1' } : process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      const passed = code === 0;
      console.log(`${passed ? 'passed' : 'FAILED'}  ${script} (${seconds}s)`);
      if (!passed && output.trim()) console.log(output.trimEnd(), '\n');
      resolve(passed);
    });
  });
}

for (const stage of STAGES) {
  const results = await Promise.all(stage.map(run));
  if (results.includes(false)) {
    console.log(`\n${stage.filter((_, index) => !results[index]).join(', ')} failed.`);
    process.exit(1);
  }
}
console.log('\nEvery check passed.');
