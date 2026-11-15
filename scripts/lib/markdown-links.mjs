// Relative links between the repository's Markdown files: every linked file exists, and a link to
// a heading of a Markdown file names a heading that file has, by its GitHub anchor.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * The GitHub anchor of a heading: lower case, punctuation other than hyphens and underscores
 * dropped, and each space a hyphen.
 * @param {string} heading
 * @returns {string}
 */
export function headingAnchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/** Lines outside fenced code blocks, with inline code removed. */
function proseLines(text) {
  let fenced = false;
  return text.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return '';
    }
    return fenced ? '' : line.replace(/`[^`]*`/g, '');
  });
}

const anchorCache = new Map();

/** The anchors of a Markdown file's headings, a repeated heading numbered as GitHub does. */
function anchorsOf(file) {
  const cached = anchorCache.get(file);
  if (cached) return cached;
  const anchors = new Set();
  const seen = new Map();
  for (const line of proseLines(readFileSync(file, 'utf8'))) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!heading?.[1]) continue;
    const base = headingAnchor(heading[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  anchorCache.set(file, anchors);
  return anchors;
}

/**
 * The broken relative links of Markdown files, as problem messages naming the file and line.
 * @param {string} root the repository root
 * @param {string[]} files full paths of the Markdown files to check
 * @returns {string[]}
 */
export function findBrokenLinks(root, files) {
  const problems = [];
  for (const file of files) {
    const name = relative(root, file);
    proseLines(readFileSync(file, 'utf8')).forEach((line, index) => {
      for (const [, target = ''] of line.matchAll(LINK)) {
        if (EXTERNAL.test(target)) continue;
        const [path = '', anchor] = target.split('#');
        const linked = path === '' ? file : join(dirname(file), decodeURIComponent(path));
        const where = `${name}:${index + 1}`;
        if (!existsSync(linked)) {
          problems.push(`${where}: links to ${path}, which does not exist`);
          continue;
        }
        if (anchor && linked.endsWith('.md') && !anchorsOf(linked).has(anchor)) {
          problems.push(`${where}: links to #${anchor}, which ${path || name} has no heading for`);
        }
      }
    });
  }
  return problems;
}
