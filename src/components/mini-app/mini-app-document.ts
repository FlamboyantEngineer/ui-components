import { miniAppBridge } from './mini-app-bridge.js';

/** A mini-app's own code: body markup, a stylesheet and a script, each self-contained. */
export interface MiniAppSource {
  /** The markup of the mini-app's `<body>`. */
  html: string;
  /** The mini-app's stylesheet. */
  css?: string | undefined;
  /** The mini-app's script, run after its markup. */
  script?: string | undefined;
}

/** A JSON value: what a mini-app saves as its state and what it starts from. */
export type MiniAppState =
  | string
  | number
  | boolean
  | null
  | readonly MiniAppState[]
  | { readonly [key: string]: MiniAppState };

export interface MiniAppDocumentOptions {
  source: MiniAppSource;
  /** The document's title. */
  title: string;
  /** The document's language and direction, the host's by default. */
  locale: { locale: string; direction: 'ltr' | 'rtl' };
  /** The `https:` origins the mini-app may load scripts, styles, images, fonts and data from. */
  allowedOrigins?: readonly string[] | undefined;
  /** The state the mini-app reads as `miniApp.state` when it starts. */
  initialState?: MiniAppState | undefined;
}

/** A host name or IP address, without the wildcard a URL would accept in a host. */
const plainHost = /^(?:[a-z0-9.-]+|\[[0-9a-f:.]+\])$/i;

function parseUrl(entry: string): URL | undefined {
  try {
    return new URL(entry);
  } catch {
    return undefined;
  }
}

/**
 * The `https:` origins of `entries` that are exactly an origin, without a path, a query or a
 * wildcard, so no entry can widen the policy beyond the origins it names.
 */
export function readAllowedOrigins(entries: readonly string[] | undefined): string[] {
  const origins = new Set<string>();
  for (const entry of entries ?? []) {
    const url = parseUrl(entry);
    if (
      url?.protocol === 'https:' &&
      plainHost.test(url.hostname) &&
      url.origin === entry.replace(/\/$/, '')
    ) {
      origins.add(url.origin);
    }
  }
  return [...origins];
}

/**
 * The Content Security Policy of a mini-app's document: its own inline code runs, and nothing loads
 * or connects anywhere but `origins`.
 */
export function createMiniAppPolicy(origins: readonly string[]): string {
  const listed = origins.join(' ');
  const directive = (name: string, ...sources: string[]) =>
    `${name} ${[...sources, listed].filter(Boolean).join(' ') || "'none'"}`;
  return [
    "default-src 'none'",
    directive('script-src', "'unsafe-inline'"),
    directive('style-src', "'unsafe-inline'"),
    directive('img-src', 'data:', 'blob:'),
    directive('font-src', 'data:'),
    directive('media-src', 'data:', 'blob:'),
    directive('connect-src'),
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ');
}

/** Keeps a closing tag inside code from ending the element that holds it. */
function escapeRawText(code: string, tag: 'script' | 'style'): string {
  return code.replace(new RegExp(`</(${tag})`, 'gi'), '<\\/$1').replace(/<!--/g, '<\\!--');
}

/** Text that is safe in an attribute value or as element content. */
function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A JSON literal that is safe inside a `<script>` element. */
function toScriptLiteral(value: MiniAppState): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * The `srcdoc` of a mini-app's frame: its language, policy and title, the bridge that gives it `window.miniApp`, its
 * stylesheet, its markup and its script, in that order.
 */
export function createMiniAppDocument({
  source,
  title,
  locale,
  allowedOrigins,
  initialState,
}: MiniAppDocumentOptions): string {
  const policy = createMiniAppPolicy(readAllowedOrigins(allowedOrigins));
  const state = toScriptLiteral(initialState ?? null);
  const css = source.css ? `<style>${escapeRawText(source.css, 'style')}</style>` : '';
  const script = source.script ? `<script>${escapeRawText(source.script, 'script')}</script>` : '';
  return [
    `<!doctype html><html lang="${escapeText(locale.locale)}" dir="${locale.direction}">`,
    '<head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${escapeText(policy)}">`,
    `<title>${escapeText(title)}</title>`,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<script>${miniAppBridge.replace('__STATE__', () => state)}</script>`,
    `${css}</head><body>${source.html}${script}</body></html>`,
  ].join('');
}
