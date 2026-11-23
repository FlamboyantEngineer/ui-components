// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  formatTestListLine,
  planShards,
  recordDurations,
  // @ts-expect-error The scripts are plain JavaScript modules without declarations.
} from '../scripts/lib/lab-shards.mjs';

interface LabTest {
  file: string;
  titles: string[];
}

interface Shard {
  seconds: number;
  tests: LabTest[];
}

const plan = planShards as (
  tests: LabTest[],
  durations: Record<string, number>,
  count: number,
) => Shard[];
const record = recordDurations as (log: string, project: string) => Record<string, number>;
const line = formatTestListLine as (project: string, test: LabTest) => string;

const testsOf = (file: string, count: number): LabTest[] =>
  Array.from({ length: count }, (_, index) => ({ file, titles: [`case ${String(index + 1)}`] }));

describe('lab shards', () => {
  it('UIC-LABS-1.7 deals slow files across shards so each runs about as long', () => {
    // In file order, an even split by count would put all six slow tests in the first shard.
    const tests = [...testsOf('chat.spec.ts', 6), ...testsOf('badge.spec.ts', 30)];
    const shards = plan(tests, { 'chat.spec.ts': 10, 'badge.spec.ts': 1 }, 3);
    expect(shards.map((shard) => shard.seconds)).toEqual([30, 30, 30]);
    expect(
      shards.map((shard) => shard.tests.filter((test) => test.file === 'chat.spec.ts').length),
    ).toEqual([2, 2, 2]);
  });

  it('UIC-LABS-1.7 places every test in exactly one shard and gives an untimed file the median time', () => {
    const tests = [
      ...testsOf('a.spec.ts', 3),
      ...testsOf('new.spec.ts', 4),
      ...testsOf('b.spec.ts', 5),
    ];
    const shards = plan(tests, { 'a.spec.ts': 1, 'b.spec.ts': 3, 'c.spec.ts': 5 }, 4);
    const placed = shards.flatMap((shard) => shard.tests);
    expect(placed).toHaveLength(tests.length);
    expect(new Set(placed)).toEqual(new Set(tests));
    expect(shards.reduce((sum, shard) => sum + shard.seconds, 0)).toBe(3 * 1 + 4 * 3 + 5 * 3);
  });

  it('UIC-LABS-1.7 plans the same shards whatever order the tests are listed in', () => {
    const tests = [...testsOf('a.spec.ts', 5), ...testsOf('b.spec.ts', 5)];
    const durations = { 'a.spec.ts': 2, 'b.spec.ts': 2 };
    const names = (shards: Shard[]) =>
      shards.map((shard) => shard.tests.map((test) => line('chromium', test)));
    expect(names(plan([...tests].reverse(), durations, 3))).toEqual(
      names(plan(tests, durations, 3)),
    );
  });

  it('UIC-LABS-1.7 names a test by project, file and title path, and refuses a title holding the separator', () => {
    expect(
      line('chromium', { file: 'chat.spec.ts', titles: ['Chat lab', 'UIC-CHAT-1.1 opens'] }),
    ).toBe('[chromium] › chat.spec.ts › Chat lab › UIC-CHAT-1.1 opens');
    expect(() => line('chromium', { file: 'chat.spec.ts', titles: ['Home › Settings'] })).toThrow(
      'e2e/chat.spec.ts: the title "Home › Settings" holds "›"',
    );
  });

  it('UIC-LABS-1.7 records the seconds per test of each file from the list reporter lines of one project', () => {
    const log = [
      'labs (chromium 1 of 6)\tUNKNOWN STEP\t2026-11-23T14:51:49Z   ✓  12 [chromium] › e2e/chat.spec.ts:105:1 › Chat lab › keeps the place (31.9s)',
      'labs (chromium 2 of 6)\tUNKNOWN STEP\t2026-11-23T14:51:50Z   ✘  13 [chromium] › e2e/chat.spec.ts:75:3 › Chat lab › follows (1.1m)',
      '  ✓  14 [chromium] › e2e/badge.spec.ts:9:3 › UIC-BADGE-1.1 draws (850ms)',
      '  ✓  15 [firefox] › e2e/badge.spec.ts:9:3 › UIC-BADGE-1.1 draws (4.0s)',
      'Installing dependencies...',
    ].join('\n');
    expect(record(log, 'chromium')).toEqual({ 'badge.spec.ts': 0.9, 'chat.spec.ts': 49 });
  });
});
