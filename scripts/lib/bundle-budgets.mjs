// Measures consumer bundles and compares them with their reviewed budgets (UIC-LABS-1.8). The
// budgets live in `scripts/bundle-budgets.json`: each consumer's measured baseline in bytes, raw and
// gzipped, and one allowance for growth over every baseline.

import { gzipSync } from 'node:zlib';

/** Raw and gzipped bytes of minified code. */
export function measureCode(code) {
  const buffer = Buffer.from(code);
  return { raw: buffer.length, gzip: gzipSync(buffer, { level: 9 }).length };
}

const PACKAGE_PATH = /(?:^|\/)node_modules\/@flamboyantengineer\/ui-components\/(?:dist\/)?(.*)$/;
const DEPENDENCY_PATH = /(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/;

/**
 * Who a bundled module belongs to: a library area (`ui-components/components/table`,
 * `ui-components/core`) or a dependency package (`react-aria`), or the consumer's own entry.
 */
export function moduleOwner(name) {
  const path = name.replace(/^\.\//, '').replace(/ \+ \d+ modules$/, '');
  const own = PACKAGE_PATH.exec(path);
  if (own) {
    const [area, part, file] = (own[1] ?? '').split('/');
    const named =
      area === 'components' ? [area, part] : part === 'locales' ? [area, part, file] : [area];
    return `ui-components/${named.join('/').replace(/\.(?:js|json)$/, '')}`;
  }
  const dependency = DEPENDENCY_PATH.exec(path);
  return dependency?.[1] ?? 'consumer';
}

/** Module sizes before minifying, summed by owner and largest first. */
export function attributeModules(modules) {
  const owners = new Map();
  for (const { name, size } of modules) {
    const owner = moduleOwner(name);
    owners.set(owner, (owners.get(owner) ?? 0) + size);
  }
  return [...owners]
    .map(([owner, size]) => ({ owner, size }))
    .sort((a, b) => b.size - a.size || a.owner.localeCompare(b.owner));
}

/** The modules whose names match any forbidden pattern. */
export function forbiddenModules(modules, patterns) {
  const expressions = patterns.map((pattern) => new RegExp(pattern));
  return modules
    .map(({ name }) => name)
    .filter((name) => expressions.some((expression) => expression.test(name)));
}

/** The growth a baseline allows: the larger of the relative and the absolute allowance. */
export function allowedGrowth(baseline, allowance) {
  return Math.max(Math.ceil(baseline * allowance.relative), allowance.absolute);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/**
 * Compares measurements (`{ [consumer]: { raw, gzip } }`) with the budgets. Returns the problems,
 * a consumer over its allowance or without a baseline, and notes, a consumer that shrank by more
 * than its allowance, so its baseline can be lowered.
 */
export function compareBudgets(measured, budgets) {
  const problems = [];
  const notes = [];
  for (const [consumer, sizes] of Object.entries(measured)) {
    const baseline = budgets.consumers[consumer];
    if (!baseline) {
      problems.push(`${consumer} has no budget; run \`npm run check:bundle-size -- --update\``);
      continue;
    }
    for (const kind of ['raw', 'gzip']) {
      const allowed = allowedGrowth(baseline[kind], budgets.allowance);
      const growth = sizes[kind] - baseline[kind];
      const summary = `${consumer} ${kind} ${kb(sizes[kind])} against a ${kb(baseline[kind])} baseline`;
      if (growth > allowed)
        problems.push(`${summary} grew by ${kb(growth)} (allowed ${kb(allowed)})`);
      else if (-growth > allowed) notes.push(`${summary} shrank by ${kb(-growth)}`);
    }
  }
  for (const consumer of Object.keys(budgets.consumers)) {
    if (!(consumer in measured)) problems.push(`${consumer} has a budget but no consumer`);
  }
  return { problems, notes };
}

/** Budgets holding the measurements as baselines, keeping the reviewed allowance. */
export function updatedBudgets(measured, budgets) {
  const consumers = Object.fromEntries(
    Object.entries(measured).map(([consumer, { raw, gzip }]) => [consumer, { raw, gzip }]),
  );
  return { ...budgets, consumers };
}
