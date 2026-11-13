// The optional, self-hosted font bundle shared by the package and the standalone labs.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

export const FONT_STYLESHEET = 'labs/build/fonts.css';
export const FONT_DIRECTORY = 'labs/build/vendor/fonts';

/** Keeps upstream subsets, styles, weights and display policy, under the reference family names. */
export function createFontBundle() {
  const resolvePackage = createRequire(import.meta.url).resolve;
  const files = {};
  const styles = [];
  for (const [family, label] of Object.entries({ geist: 'Geist', 'geist-mono': 'Geist Mono' })) {
    const name = `@fontsource-variable/${family}`;
    files[`${FONT_DIRECTORY}/${family}-LICENSE`] = resolvePackage(`${name}/LICENSE`);
    for (const sheet of ['index.css', 'wght-italic.css']) {
      let css = readFileSync(resolvePackage(`${name}/${sheet}`), 'utf8');
      css = css.replaceAll(`'${label} Variable'`, `'${label}'`);
      for (const [, file] of [...css.matchAll(/url\(\.\/files\/([^)]+)\)/g)]) {
        files[`${FONT_DIRECTORY}/${file}`] = resolvePackage(`${name}/files/${file}`);
        css = css.replaceAll(`url(./files/${file})`, `url('./vendor/fonts/${file}')`);
      }
      styles.push(css.trim());
    }
  }
  return { css: `${styles.join('\n\n')}\n`, files };
}

/** Rejects missing or modified font assets, including each family's upstream license. */
export function fontBundleProblems(directory) {
  const bundle = createFontBundle();
  const problems = [];
  const stylesheet = join(directory, FONT_STYLESHEET);
  if (!existsSync(stylesheet)) problems.push(`missing ${FONT_STYLESHEET}`);
  else if (readFileSync(stylesheet, 'utf8') !== bundle.css)
    problems.push(`${FONT_STYLESHEET} differs from the default font declarations`);
  for (const [file, source] of Object.entries(bundle.files)) {
    const target = join(directory, file);
    if (!existsSync(target)) problems.push(`missing ${file}`);
    else if (!readFileSync(target).equals(readFileSync(source)))
      problems.push(`${file} differs from its upstream font asset`);
  }
  return problems;
}
