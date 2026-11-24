import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { relativePosix } from './lib/script.mjs';

/** @param {unknown} value @returns {string[]} */
function readTargets(value) {
  if (typeof value === 'string') return [value];
  return value && typeof value === 'object' ? Object.values(value).flatMap(readTargets) : [];
}

/**
 * Finds source or declaration paths for the JavaScript entries a package exports. A package
 * wildcard can substitute an entire nested path; repeated wildcards in a target use the same path.
 * @param {string} root
 * @param {string} directory the source or declaration directory
 * @param {string[]} paths candidate file paths under `directory`
 * @param {'source' | 'declaration'} kind
 */
export function findPackageEntries(root, directory, paths, kind) {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const extension = kind === 'source' ? '\\.tsx?' : '\\.d\\.ts';
  const patterns = new Set();
  for (const target of readTargets(manifest.exports)) {
    const path = /^\.\/dist\/(.+)\.(?:d\.ts|js)$/.exec(target)?.[1];
    if (!path) continue;
    const escaped = path
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .reduce((pattern, part, index) => `${pattern}${index === 1 ? '(.*)' : '\\1'}${part}`);
    patterns.add(`^${escaped}${extension}$`);
  }
  const matchers = [...patterns].map((pattern) => new RegExp(pattern));
  return paths.filter((path) => {
    const relative = relativePosix(directory, path);
    return matchers.some((matcher) => matcher.test(relative));
  });
}
