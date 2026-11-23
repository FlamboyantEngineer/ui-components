// Pure parts of scripts/lab-shards.mjs: the duration-balanced plan and the durations record.

const SEPARATOR = ' › ';
const RESULT_LINE =
  /[✓✘-]\s+\d+\s+\[([\w-]+)\] › e2e\/(\S+?):\d+:\d+ › .* \((\d+(?:\.\d+)?)(ms|s|m)\)\s*$/;
/** @type {Record<string, number>} */
const UNIT_SECONDS = { ms: 0.001, s: 1, m: 60 };

/** @typedef {{ file: string, titles: string[] }} LabTest */
/** @typedef {{ seconds: number, tests: LabTest[] }} Shard */

/** @param {number[]} values */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 1;
}

/**
 * Deals the tests to `count` shards, slowest first, each to the shard with the least time.
 * @param {LabTest[]} tests
 * @param {Record<string, number>} durations seconds per test of each file
 * @param {number} count
 * @returns {Shard[]}
 */
export function planShards(tests, durations, count) {
  const fallback = median(Object.values(durations));
  const timed = tests.map((test) => ({ test, seconds: durations[test.file] ?? fallback }));
  // A stable order, so every shard job of a run computes the same plan.
  timed.sort(
    (a, b) => b.seconds - a.seconds || describeTest(a.test).localeCompare(describeTest(b.test)),
  );
  /** @type {Shard[]} */
  const shards = Array.from({ length: count }, () => ({ seconds: 0, tests: [] }));
  for (const { test, seconds } of timed) {
    const lightest = shards.reduce((best, shard) => (shard.seconds < best.seconds ? shard : best));
    lightest.seconds += seconds;
    lightest.tests.push(test);
  }
  return shards;
}

/** @param {LabTest} test */
function describeTest(test) {
  return [test.file, ...test.titles].join(SEPARATOR);
}

/**
 * One `--test-list` line; Playwright splits a line at `›`, so a title must not hold one.
 * @param {string} project
 * @param {LabTest} test
 */
export function formatTestListLine(project, test) {
  const clash = test.titles.find((title) => title.includes('›'));
  if (clash !== undefined) {
    throw new Error(
      `e2e/${test.file}: the title "${clash}" holds "›", which --test-list cannot name`,
    );
  }
  return `[${project}]${SEPARATOR}${describeTest(test)}`;
}

/**
 * The seconds per test of each file, from the list reporter's result lines of one project.
 * @param {string} log
 * @param {string} project
 * @returns {Record<string, number>}
 */
export function recordDurations(log, project) {
  /** @type {Map<string, { seconds: number, tests: number }>} */
  const totals = new Map();
  for (const line of log.split('\n')) {
    const match = RESULT_LINE.exec(line);
    if (!match || match[1] !== project) continue;
    const [, , file = '', amount = '', unit = ''] = match;
    const total = totals.get(file) ?? { seconds: 0, tests: 0 };
    total.seconds += Number(amount) * (UNIT_SECONDS[unit] ?? 1);
    total.tests += 1;
    totals.set(file, total);
  }
  return Object.fromEntries(
    [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, { seconds, tests }]) => [file, Math.round((seconds / tests) * 10) / 10]),
  );
}
