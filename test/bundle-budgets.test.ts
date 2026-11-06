// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  allowedGrowth,
  attributeModules,
  compareBudgets,
  forbiddenModules,
  measureCode,
  moduleOwner,
  updatedBudgets,
  // @ts-expect-error The scripts are plain JavaScript modules without declarations.
} from '../scripts/lib/bundle-budgets.mjs';

interface Budgets {
  allowance: { relative: number; absolute: number };
  consumers: Record<string, { raw: number; gzip: number }>;
}

const budgets: Budgets = {
  allowance: { relative: 0.05, absolute: 2048 },
  consumers: { button: { raw: 100_000, gzip: 30_000 } },
};

const installed = './node_modules/@flamboyantengineer/ui-components/dist';

describe('consumer bundle budgets', () => {
  it('UIC-LABS-1.8 allows the larger of the relative and the absolute growth', () => {
    expect(allowedGrowth(100_000, budgets.allowance)).toBe(5000);
    expect(allowedGrowth(10_000, budgets.allowance)).toBe(2048);
  });

  it('UIC-LABS-1.8 fails a consumer over its allowance and notes one well under it', () => {
    expect(compareBudgets({ button: { raw: 105_000, gzip: 30_500 } }, budgets)).toEqual({
      problems: [],
      notes: [],
    });
    const grown = compareBudgets({ button: { raw: 105_001, gzip: 30_000 } }, budgets);
    expect(grown.problems).toEqual([expect.stringMatching(/^button raw .* grew by /)]);
    const shrunk = compareBudgets({ button: { raw: 90_000, gzip: 30_000 } }, budgets);
    expect(shrunk).toEqual({
      problems: [],
      notes: [expect.stringMatching(/^button raw .* shrank by /)],
    });
  });

  it('UIC-LABS-1.8 fails a consumer without a budget and a budget without a consumer', () => {
    const { problems } = compareBudgets({ table: { raw: 1, gzip: 1 } }, budgets);
    expect(problems).toEqual([
      expect.stringMatching(/^table has no budget/),
      expect.stringMatching(/^button has a budget but no consumer/),
    ]);
  });

  it('UIC-LABS-1.8 updates the baselines and keeps the reviewed allowance', () => {
    expect(updatedBudgets({ table: { raw: 7, gzip: 3 } }, budgets)).toEqual({
      allowance: budgets.allowance,
      consumers: { table: { raw: 7, gzip: 3 } },
    });
  });

  it('UIC-LABS-1.8 attributes modules to library areas, locales and dependency packages', () => {
    expect(moduleOwner(`${installed}/components/table/table.js`)).toBe(
      'ui-components/components/table',
    );
    expect(moduleOwner(`${installed}/core/locales/fr.js`)).toBe('ui-components/core/locales/fr');
    expect(moduleOwner(`${installed}/core/provider.js`)).toBe('ui-components/core');
    expect(moduleOwner('../node_modules/@react-aria/button/dist/useButton.mjs')).toBe(
      '@react-aria/button',
    );
    expect(moduleOwner('./entry.js')).toBe('consumer');
    expect(
      attributeModules([
        { name: '../node_modules/katex/dist/katex.mjs', size: 10 },
        { name: `${installed}/core/clock.js`, size: 4 },
        { name: `${installed}/core/provider.js`, size: 8 },
      ]),
    ).toEqual([
      { owner: 'ui-components/core', size: 12 },
      { owner: 'katex', size: 10 },
    ]);
  });

  it('UIC-LABS-1.8 finds the heavy modules a simple consumer must leave out', () => {
    const modules = [
      { name: `${installed}/core/locales/en.js`, size: 1 },
      { name: `${installed}/core/locales/ja.js`, size: 1 },
      { name: '../node_modules/prosemirror-view/dist/index.js', size: 1 },
    ];
    expect(
      forbiddenModules(modules, ['prosemirror', 'ui-components/dist/core/locales/(?!index|en)']),
    ).toEqual([
      `${installed}/core/locales/ja.js`,
      '../node_modules/prosemirror-view/dist/index.js',
    ]);
  });

  it('UIC-LABS-1.8 measures raw and gzipped bytes', () => {
    const { raw, gzip } = measureCode('a'.repeat(1000)) as { raw: number; gzip: number };
    expect(raw).toBe(1000);
    expect(gzip).toBeLessThan(100);
  });

  it('UIC-LABS-1.8 keeps a baseline for every consumer and the reviewed allowance', () => {
    const file = JSON.parse(readFileSync('scripts/bundle-budgets.json', 'utf8')) as Budgets;
    expect(file.allowance).toEqual({ relative: 0.05, absolute: 2048 });
    expect(Object.keys(file.consumers)).toEqual(
      expect.arrayContaining(['button', 'text-field', 'table', 'markdown', 'rich-text-editor']),
    );
  });
});
