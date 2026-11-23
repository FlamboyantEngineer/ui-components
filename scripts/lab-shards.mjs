#!/usr/bin/env node
// Splits one Playwright project's lab tests into shards of about equal running time (UIC-LABS-1.7).
// Playwright's own `--shard` cuts the test list into runs of equal length in file order, so a
// shard that draws the slow chat tests runs twice as long as the others. This script gives every
// test its file's measured seconds per test, deals the tests out slowest first, each to the shard
// with the least time so far, and writes the chosen shard's tests as a `--test-list` file.
//
//   node scripts/lab-shards.mjs plan --project chromium --shards 6 --shard 2 --out <file>
//   gh run view <run> --log | node scripts/lab-shards.mjs record --project chromium
//
// `record` reads the list reporter's lines from a CI log (every shard of one run) and rewrites
// scripts/lab-durations.json, the seconds per test of each file. A file it has no time for, such
// as a new browser test, counts as the median file.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { formatTestListLine, planShards, recordDurations } from './lib/lab-shards.mjs';
import { root } from './lib/root.mjs';

const DURATIONS = join(root, 'scripts/lab-durations.json');

/** The tests of one project, as the file relative to the test directory and the title path. */
function listTests(project, testList) {
  const args = ['playwright', 'test', '--list', '--reporter=json', `--project=${project}`];
  if (testList) args.push('--test-list', testList);
  const report = JSON.parse(
    execFileSync('npx', args, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }),
  );
  const tests = [];
  const visit = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        if (test.projectName === project)
          tests.push({ file: spec.file, titles: [...titles, spec.title] });
      }
    }
    for (const child of suite.suites ?? []) visit(child, [...titles, child.title]);
  };
  for (const fileSuite of report.suites) visit(fileSuite, []);
  return tests;
}

function plan(options) {
  const count = Number(options.shards);
  const shard = Number(options.shard);
  if (!Number.isInteger(count) || !Number.isInteger(shard) || shard < 1 || shard > count) {
    throw new Error(`--shard ${options.shard} --shards ${options.shards} names no shard`);
  }
  const durations = JSON.parse(readFileSync(DURATIONS, 'utf8'));
  const shards = planShards(listTests(options.project), durations, count);
  // The shard number was checked against the count above.
  const lines = (shards[shard - 1]?.tests ?? []).map((test) =>
    formatTestListLine(options.project, test),
  );
  writeFileSync(options.out, `${lines.join('\n')}\n`);
  // Playwright skips a line that names no test, so check that the list selects exactly its tests.
  const selected = listTests(options.project, options.out).length;
  if (selected !== lines.length) {
    throw new Error(`${options.out} selects ${selected} tests, not the ${lines.length} it lists`);
  }
  const plannedSeconds = shards.map((each) => Math.round(each.seconds)).join(', ');
  console.log(
    `shard ${shard} of ${count}: ${lines.length} tests; planned seconds ${plannedSeconds}`,
  );
}

function record(options) {
  const durations = recordDurations(readFileSync(0, 'utf8'), options.project);
  if (Object.keys(durations).length === 0) {
    throw new Error(`the log on standard input holds no [${options.project}] test results`);
  }
  writeFileSync(DURATIONS, `${JSON.stringify(durations, null, 2)}\n`);
  console.log(`scripts/lab-durations.json: ${Object.keys(durations).length} files`);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    project: { type: 'string', default: 'chromium' },
    shards: { type: 'string' },
    shard: { type: 'string' },
    out: { type: 'string' },
  },
});
const [command] = positionals;
if (command === 'plan' && values.out) plan(values);
else if (command === 'record') record(values);
else throw new Error('usage: lab-shards.mjs plan --shards <n> --shard <i> --out <file> | record');
