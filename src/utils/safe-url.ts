// URL scheme checks for links and images taken from authored content (specs/MARKUP.md).

/** The schemes `isSafeUrl` accepts by default. */
export const defaultUrlSchemes: readonly string[] = Object.freeze([
  'http',
  'https',
  'mailto',
  'tel',
]);

const schemePattern = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Whether a URL from authored content is safe to render: relative (a path, `?query`, `#fragment`,
 * `//host`) or using one of `schemes`. Control characters and whitespace are ignored first, as a
 * browser ignores them, so `java\tscript:` reads as `javascript:`.
 */
export function isSafeUrl(url: string, schemes: readonly string[] = defaultUrlSchemes): boolean {
  const compact = [...url].filter((char) => char > ' ' && char !== '\u007f').join('');
  const scheme = schemePattern.exec(compact)?.[1]?.toLowerCase();
  return scheme === undefined || schemes.some((allowed) => allowed.toLowerCase() === scheme);
}
