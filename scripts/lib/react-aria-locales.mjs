// React Aria ships its own strings for about 34 locales and every bundle that uses it carries all of
// them. The library translates its own text into the languages of `src/core/locales`, so a host
// keeps React Aria's strings for those (and any it adds) with `@react-aria/optimize-locales-plugin`, as
// the README's "Languages" section shows. The lab build and the consumer bundle budgets do the same.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './script.mjs';

/** The languages the library ships a language file for, such as `en` and `fr`. */
export const LIBRARY_LOCALES = readdirSync(join(root, 'src/core/locales'))
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.slice(0, -'.json'.length))
  .sort();

/** The languages the labs also demonstrate formatting and direction in. */
export const LAB_LOCALES = [...LIBRARY_LOCALES, 'ar', 'de', 'he', 'sv'];

const REACT_ARIA_FILE =
  /[/\\]node_modules[/\\](?:@react-aria|@react-stately|react-aria|react-stately|react-aria-components)[/\\]/;

/**
 * An esbuild plugin that keeps React Aria's strings for `locales` only, as the package's own
 * plugin does for webpack and Vite: each other locale's strings module resolves to an empty one,
 * which React Aria skips. (The package's esbuild variant resolves to a namespace nothing loads.)
 * @param {readonly string[]} locales Languages, such as `en`, or locales, such as `fr-CA`.
 * @returns {import('esbuild').Plugin}
 */
export function optimizeLocalesForEsbuild(locales) {
  const kept = locales.map((locale) => new Intl.Locale(locale));
  const keeps = (locale) =>
    kept.some(
      ({ language, region }) =>
        language === locale.language && (region === undefined || region === locale.region),
    );
  return {
    name: 'react-aria-locales',
    setup(build) {
      build.onResolve({ filter: /[/\\][a-z]{2}-[A-Z]{2}\.m?js$/ }, ({ path, importer }) => {
        const locale = new Intl.Locale(/([a-z]{2}-[A-Z]{2})\.m?js$/.exec(path)?.[1] ?? 'und');
        if (!REACT_ARIA_FILE.test(importer) || keeps(locale)) return undefined;
        return { path, namespace: 'react-aria-removed-locale' };
      });
      build.onLoad({ filter: /.*/, namespace: 'react-aria-removed-locale' }, () => ({
        contents: 'export default undefined;',
        loader: 'js',
      }));
    },
  };
}
