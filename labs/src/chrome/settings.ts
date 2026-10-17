// Lab stylesheet and theme settings: read from the query string, then localStorage, then defaults.

export type StylesheetChoice =
  | { kind: 'none' }
  | { kind: 'reference' }
  | { kind: 'custom'; url: string };

export interface LabSettings {
  stylesheet: StylesheetChoice;
  /** Value written to `themeAttribute` on the root element; empty writes nothing. */
  theme: string;
  /** Root attribute the host's theme switch reads, `data-theme` by default. */
  themeAttribute: string;
}

export const REFERENCE_STYLESHEET = 'reference.css';
export const DEFAULT_THEME_ATTRIBUTE = 'data-theme';
export const STYLESHEET_LINK_ID = 'ui-lab-stylesheet';

const STORAGE_KEYS = {
  stylesheet: 'ui-labs:stylesheet',
  theme: 'ui-labs:theme',
  themeAttribute: 'ui-labs:theme-attribute',
} as const;

const ATTRIBUTE_NAME = /^[a-z][a-z0-9-]*$/i;

export const defaultSettings: LabSettings = {
  stylesheet: { kind: 'reference' },
  theme: '',
  themeAttribute: DEFAULT_THEME_ATTRIBUTE,
};

export function parseStylesheet(value: string | null | undefined): StylesheetChoice | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  const trimmed = value.trim();
  if (trimmed === 'none') return { kind: 'none' };
  if (trimmed === 'reference') return { kind: 'reference' };
  return { kind: 'custom', url: trimmed };
}

export function formatStylesheet(choice: StylesheetChoice): string {
  return choice.kind === 'custom' ? choice.url : choice.kind;
}

export function isValidThemeAttribute(name: string): boolean {
  return ATTRIBUTE_NAME.test(name);
}

function safeGet(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | null, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch {
    // Remembering the choice is a convenience; private windows may refuse it.
  }
}

/** The page's localStorage, or null when the browser refuses access. */
export function labStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Query string wins, then the remembered choice, then the defaults. */
export function readSettings(search: string, storage: Storage | null): LabSettings {
  const query = new URLSearchParams(search);
  const stylesheet =
    parseStylesheet(query.get('stylesheet')) ??
    parseStylesheet(safeGet(storage, STORAGE_KEYS.stylesheet)) ??
    defaultSettings.stylesheet;
  const theme = query.has('theme')
    ? (query.get('theme') ?? '')
    : (safeGet(storage, STORAGE_KEYS.theme) ?? defaultSettings.theme);
  const attribute =
    query.get('themeAttribute') ??
    safeGet(storage, STORAGE_KEYS.themeAttribute) ??
    defaultSettings.themeAttribute;
  return {
    stylesheet,
    theme: theme.trim(),
    themeAttribute: isValidThemeAttribute(attribute) ? attribute : DEFAULT_THEME_ATTRIBUTE,
  };
}

/** Remembers a choice the reader made in the chrome. */
export function rememberSettings(settings: LabSettings, storage: Storage | null): void {
  safeSet(storage, STORAGE_KEYS.stylesheet, formatStylesheet(settings.stylesheet));
  safeSet(storage, STORAGE_KEYS.theme, settings.theme);
  safeSet(storage, STORAGE_KEYS.themeAttribute, settings.themeAttribute);
}

/** The query string for `settings`, keeping unrelated parameters from `search`. */
export function settingsSearch(settings: LabSettings, search = ''): string {
  const query = new URLSearchParams(search);
  query.set('stylesheet', formatStylesheet(settings.stylesheet));
  if (settings.theme) query.set('theme', settings.theme);
  else query.delete('theme');
  if (settings.themeAttribute !== DEFAULT_THEME_ATTRIBUTE) {
    query.set('themeAttribute', settings.themeAttribute);
  } else {
    query.delete('themeAttribute');
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

export type StylesheetState = 'none' | 'loading' | 'loaded' | 'error';

let appliedThemeAttribute: string | null = null;

/**
 * Loads the chosen stylesheet and writes the theme attribute on the root element.
 * `data-lab-stylesheet-state` on the root reports none, loading, loaded or error.
 */
export function applySettings(settings: LabSettings, doc: Document = document): void {
  const root = doc.documentElement;
  const setState = (state: StylesheetState) => {
    root.dataset.labStylesheetState = state;
  };
  root.dataset.labStylesheet = settings.stylesheet.kind;

  let link = doc.getElementById(STYLESHEET_LINK_ID) as HTMLLinkElement | null;
  if (settings.stylesheet.kind === 'none') {
    link?.remove();
    setState('none');
  } else {
    const href =
      settings.stylesheet.kind === 'reference' ? REFERENCE_STYLESHEET : settings.stylesheet.url;
    const resolved = new URL(href, doc.baseURI).href;
    if (!link || link.href !== resolved) {
      link?.remove();
      link = doc.createElement('link');
      link.id = STYLESHEET_LINK_ID;
      link.rel = 'stylesheet';
      link.addEventListener('load', () => setState('loaded'));
      link.addEventListener('error', () => setState('error'));
      setState('loading');
      link.href = href;
      doc.head.append(link);
    }
  }

  if (appliedThemeAttribute && appliedThemeAttribute !== settings.themeAttribute) {
    root.removeAttribute(appliedThemeAttribute);
  }
  if (settings.theme) {
    root.setAttribute(settings.themeAttribute, settings.theme);
    appliedThemeAttribute = settings.themeAttribute;
  } else {
    root.removeAttribute(settings.themeAttribute);
    appliedThemeAttribute = null;
  }
}
