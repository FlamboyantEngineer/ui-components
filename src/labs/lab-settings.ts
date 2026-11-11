// Lab stylesheet and theme settings: read from the query string, then the remembered choice, then
// the defaults, and applied to the page's root element and head.

import type { UiStorage } from '../core/storage.js';

/** The stylesheet a lab page loads: none, the library's reference sheet, or any URL. */
export type LabStylesheet =
  { kind: 'none' } | { kind: 'reference' } | { kind: 'custom'; url: string };

export interface LabSettings {
  stylesheet: LabStylesheet;
  /**
   * `system` follows the reader's colour scheme, writing `light` or `dark`; any other value is
   * written to `themeAttribute` on the root element as it is, and empty writes nothing.
   */
  theme: string;
  /** Root data attribute the host's theme switch reads, excluding `data-lab-*`. */
  themeAttribute: string;
}

type StylesheetState = 'none' | 'loading' | 'loaded' | 'error';

export const DEFAULT_THEME_ATTRIBUTE = 'data-theme';

/** The theme that follows the reader's colour scheme. */
export const SYSTEM_THEME = 'system';

const darkSchemeQuery = '(prefers-color-scheme: dark)';

/** Where the reference option loads its stylesheet from, relative to the page. */
export const DEFAULT_REFERENCE_STYLESHEET = 'build/reference.css';

const stylesheetLinkId = 'ui-lab-stylesheet';

const storageKeys = {
  stylesheet: 'ui-labs:stylesheet',
  theme: 'ui-labs:theme',
  themeAttribute: 'ui-labs:theme-attribute',
} as const;

const attributeNamePattern = /^data-(?!lab-)[a-z0-9][a-z0-9-]*$/i;

export const defaultSettings: LabSettings = {
  stylesheet: { kind: 'reference' },
  theme: SYSTEM_THEME,
  themeAttribute: DEFAULT_THEME_ATTRIBUTE,
};

function parseStylesheet(value: string | null | undefined): LabStylesheet | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  const trimmed = value.trim();
  if (trimmed === 'none') return { kind: 'none' };
  if (trimmed === 'reference') return { kind: 'reference' };
  return { kind: 'custom', url: trimmed };
}

function formatStylesheet(choice: LabStylesheet): string {
  return choice.kind === 'custom' ? choice.url : choice.kind;
}

export function isValidThemeAttribute(name: string): boolean {
  return attributeNamePattern.test(name);
}

/** Query string wins, then the remembered choice, then the defaults. */
export function readSettings(search: string, storage: UiStorage | null): LabSettings {
  const query = new URLSearchParams(search);
  const stylesheet =
    parseStylesheet(query.get('stylesheet')) ??
    parseStylesheet(storage?.getItem(storageKeys.stylesheet)) ??
    defaultSettings.stylesheet;
  // An empty theme is a choice, writing nothing; only a missing one falls back to the default.
  const theme = query.has('theme')
    ? (query.get('theme') ?? '')
    : (storage?.getItem(storageKeys.theme) ?? defaultSettings.theme);
  const attribute =
    query.get('themeAttribute') ??
    storage?.getItem(storageKeys.themeAttribute) ??
    defaultSettings.themeAttribute;
  return {
    stylesheet,
    theme: theme.trim(),
    themeAttribute: isValidThemeAttribute(attribute) ? attribute : DEFAULT_THEME_ATTRIBUTE,
  };
}

/** Remembers a choice the reader made in the chrome. */
export function rememberSettings(settings: LabSettings, storage: UiStorage | null): void {
  storage?.setItem(storageKeys.stylesheet, formatStylesheet(settings.stylesheet));
  storage?.setItem(storageKeys.theme, settings.theme);
  storage?.setItem(storageKeys.themeAttribute, settings.themeAttribute);
}

/**
 * The query string for `settings`, keeping unrelated parameters from `search`; a setting at its
 * default is left out.
 */
export function settingsSearch(settings: LabSettings, search = ''): string {
  const query = new URLSearchParams(search);
  const stylesheet = formatStylesheet(settings.stylesheet);
  if (stylesheet === formatStylesheet(defaultSettings.stylesheet)) query.delete('stylesheet');
  else query.set('stylesheet', stylesheet);
  if (settings.theme === defaultSettings.theme) query.delete('theme');
  else query.set('theme', settings.theme);
  if (settings.themeAttribute !== DEFAULT_THEME_ATTRIBUTE) {
    query.set('themeAttribute', settings.themeAttribute);
  } else {
    query.delete('themeAttribute');
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

function applyStylesheet(stylesheet: LabStylesheet, reference: string, doc: Document): void {
  const root = doc.documentElement;
  const setState = (state: StylesheetState) => {
    root.dataset.labStylesheetState = state;
  };
  root.dataset.labStylesheet = stylesheet.kind;

  let link = doc.getElementById(stylesheetLinkId) as HTMLLinkElement | null;
  if (stylesheet.kind === 'none') {
    link?.remove();
    setState('none');
  } else {
    const href = stylesheet.kind === 'reference' ? reference : stylesheet.url;
    let resolved: string;
    try {
      resolved = new URL(href, doc.baseURI).href;
    } catch {
      link?.remove();
      setState('error');
      return;
    }
    if (!link || link.href !== resolved) {
      link?.remove();
      link = doc.createElement('link');
      link.id = stylesheetLinkId;
      link.rel = 'stylesheet';
      // Applied from the page head, the sheet holds the first paint until it loads.
      link.setAttribute('blocking', 'render');
      link.addEventListener('load', () => {
        if (doc.getElementById(stylesheetLinkId) === link) setState('loaded');
      });
      link.addEventListener('error', () => {
        if (doc.getElementById(stylesheetLinkId) === link) setState('error');
      });
      setState('loading');
      link.href = href;
      doc.head.append(link);
    }
  }
}

/** The value the theme writes: `light` or `dark` for the system theme, else the theme itself. */
export function resolveTheme(theme: string, view: Window | null = window): string {
  if (theme !== SYSTEM_THEME) return theme;
  return view?.matchMedia?.(darkSchemeQuery).matches ? 'dark' : 'light';
}

/** Calls `onChange` whenever the reader's colour scheme changes; returns the unsubscribe. */
export function watchColorScheme(onChange: () => void, view: Window = window): () => void {
  const query = view.matchMedia?.(darkSchemeQuery);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/**
 * Loads the chosen stylesheet and writes the theme attribute on the root element. The page head
 * applies the settings before the body is parsed and the lab bar applies them again, so the
 * attribute last written is remembered on the root (`data-lab-theme-attribute`), not in memory.
 * `data-lab-stylesheet-state` on the root reports none, loading, loaded or error, and
 * `data-lab-scheme` the colour scheme a light or dark theme sets, which the chrome follows.
 */
export function applySettings(
  settings: LabSettings,
  reference: string = DEFAULT_REFERENCE_STYLESHEET,
  doc: Document = document,
): void {
  const root = doc.documentElement;
  applyStylesheet(settings.stylesheet, reference, doc);
  const attribute = isValidThemeAttribute(settings.themeAttribute)
    ? settings.themeAttribute
    : DEFAULT_THEME_ATTRIBUTE;
  const previous = root.dataset.labThemeAttribute;
  if (previous && previous !== attribute && isValidThemeAttribute(previous)) {
    root.removeAttribute(previous);
  }
  const value = resolveTheme(settings.theme, doc.defaultView);
  if (value) {
    root.setAttribute(attribute, value);
    root.dataset.labThemeAttribute = attribute;
  } else {
    root.removeAttribute(attribute);
    delete root.dataset.labThemeAttribute;
  }
  if (value === 'light' || value === 'dark') root.dataset.labScheme = value;
  else delete root.dataset.labScheme;
}

export interface LabSettingsOptions {
  /** Remembers the reader's last choice; refused reads and writes fall back to the defaults. */
  storage: UiStorage | null;
  /** The reference option's stylesheet URL. Defaults to `build/reference.css`. */
  referenceStylesheet?: string | undefined;
}

/**
 * Reads the settings from the page's query string and `storage`, and applies them. A lab page runs
 * it from a classic script in its head, so the first paint already has the stylesheet and theme.
 */
export function bootLabSettings({ storage, referenceStylesheet }: LabSettingsOptions): LabSettings {
  const settings = readSettings(location.search, storage);
  applySettings(settings, referenceStylesheet);
  return settings;
}
