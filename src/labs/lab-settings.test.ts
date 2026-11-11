import { afterEach, describe, expect, it } from 'vitest';
import { createSafeStorage } from '../core/storage.js';
import {
  applySettings,
  defaultSettings,
  readSettings,
  rememberSettings,
  resolveTheme,
  settingsSearch,
} from './lab-settings.js';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
} as unknown as Storage;

afterEach(() => {
  document.getElementById('ui-lab-stylesheet')?.remove();
  const names = ['data-theme', 'data-mode', 'data-lab-theme-attribute', 'data-lab-scheme'];
  for (const name of names) document.documentElement.removeAttribute(name);
});

// UIC-LABS-2.1 UIC-LABS-2.2 UIC-LABS-2.3
describe('readSettings', () => {
  it('defaults to the reference sheet and the system theme, and keeps an empty theme', () => {
    expect(readSettings('', memoryStorage())).toEqual(defaultSettings);
    expect(defaultSettings.theme).toBe('system');
    expect(readSettings('?theme=', memoryStorage()).theme).toBe('');
    expect(readSettings('', memoryStorage({ 'ui-labs:theme': '' })).theme).toBe('');
  });

  it('prefers the query string over the remembered choice', () => {
    const storage = memoryStorage({ 'ui-labs:stylesheet': 'none', 'ui-labs:theme': 'light' });
    expect(readSettings('?stylesheet=/app.css&theme=dark', storage)).toEqual({
      stylesheet: { kind: 'custom', url: '/app.css' },
      theme: 'dark',
      themeAttribute: 'data-theme',
    });
    expect(readSettings('', storage)).toMatchObject({
      stylesheet: { kind: 'none' },
      theme: 'light',
    });
  });

  it('ignores an invalid theme attribute and survives refusing storage', () => {
    expect(readSettings('?themeAttribute=1bad', null).themeAttribute).toBe('data-theme');
    const refusing = createSafeStorage(throwingStorage);
    expect(readSettings('', refusing)).toEqual(defaultSettings);
    expect(() => rememberSettings(defaultSettings, refusing)).not.toThrow();
  });

  it('UIC-LABS-2.2 rejects event handlers and reserved lab attributes from queries and storage', () => {
    for (const attribute of ['onpointerover', 'style', 'class', 'data-lab-stylesheet-state']) {
      expect(readSettings(`?themeAttribute=${attribute}`, null).themeAttribute).toBe('data-theme');
      expect(
        readSettings('', memoryStorage({ 'ui-labs:theme-attribute': attribute })).themeAttribute,
      ).toBe('data-theme');
    }
  });
});

describe('settings round trip', () => {
  it('remembers and re-reads a choice', () => {
    const storage = memoryStorage();
    rememberSettings(
      { stylesheet: { kind: 'custom', url: 'x.css' }, theme: 'dark', themeAttribute: 'data-mode' },
      storage,
    );
    expect(readSettings('', storage)).toEqual({
      stylesheet: { kind: 'custom', url: 'x.css' },
      theme: 'dark',
      themeAttribute: 'data-mode',
    });
  });

  it('writes the query string and keeps unrelated parameters', () => {
    expect(settingsSearch(defaultSettings, '?case=3')).toBe('?case=3');
    expect(settingsSearch(defaultSettings, '?stylesheet=none')).toBe('');
    expect(settingsSearch({ ...defaultSettings, theme: '' })).toBe('?theme=');
    expect(
      settingsSearch({ stylesheet: { kind: 'none' }, theme: 'dark', themeAttribute: 'data-mode' }),
    ).toBe('?stylesheet=none&theme=dark&themeAttribute=data-mode');
  });
});

describe('applySettings', () => {
  it('UIC-LABS-2.2 writes theme text only to safe data attributes', () => {
    const theme = 'document.documentElement.dataset.executed="yes"';
    applySettings({ ...defaultSettings, theme, themeAttribute: 'onpointerover' });
    expect(document.documentElement).not.toHaveAttribute('onpointerover');
    expect(document.documentElement).toHaveAttribute('data-theme', theme);
    applySettings({
      ...defaultSettings,
      theme: 'hidden',
      themeAttribute: 'data-lab-stylesheet-state',
    });
    expect(document.documentElement).toHaveAttribute('data-lab-stylesheet-state', 'loading');
    expect(document.documentElement).toHaveAttribute('data-theme', 'hidden');
  });

  it('UIC-LABS-2.1 reports an invalid stylesheet URL and recovers on the next choice', () => {
    applySettings(defaultSettings);
    applySettings({
      ...defaultSettings,
      stylesheet: { kind: 'custom', url: 'http://[' },
      theme: 'dark',
    });
    expect(document.documentElement.dataset.labStylesheetState).toBe('error');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.getElementById('ui-lab-stylesheet')).toBeNull();
    applySettings(defaultSettings);
    expect(document.documentElement.dataset.labStylesheetState).toBe('loading');
    expect(document.getElementById('ui-lab-stylesheet')?.getAttribute('href')).toBe(
      'build/reference.css',
    );
  });

  it('UIC-LABS-2.1 ignores load events from a stylesheet that has been replaced', () => {
    applySettings(defaultSettings);
    const previous = document.getElementById('ui-lab-stylesheet') as HTMLLinkElement;
    applySettings({ ...defaultSettings, stylesheet: { kind: 'custom', url: '/host.css' } });
    previous.dispatchEvent(new Event('load'));
    expect(document.documentElement.dataset.labStylesheetState).toBe('loading');
    const current = document.getElementById('ui-lab-stylesheet') as HTMLLinkElement;
    current.dispatchEvent(new Event('load'));
    expect(document.documentElement.dataset.labStylesheetState).toBe('loaded');
    previous.dispatchEvent(new Event('error'));
    expect(document.documentElement.dataset.labStylesheetState).toBe('loaded');
    applySettings({ ...defaultSettings, stylesheet: { kind: 'none' } });
    current.dispatchEvent(new Event('load'));
    expect(document.documentElement.dataset.labStylesheetState).toBe('none');
  });

  it('adds, swaps and removes the stylesheet link', () => {
    applySettings(defaultSettings);
    const link = document.getElementById('ui-lab-stylesheet') as HTMLLinkElement;
    expect(link).toHaveAttribute('href', 'build/reference.css');
    expect(document.documentElement.dataset.labStylesheetState).toBe('loading');

    applySettings({ ...defaultSettings, stylesheet: { kind: 'custom', url: '/host.css' } });
    expect(document.getElementById('ui-lab-stylesheet')?.getAttribute('href')).toBe('/host.css');

    applySettings({ ...defaultSettings, stylesheet: { kind: 'none' } });
    expect(document.getElementById('ui-lab-stylesheet')).toBeNull();
    expect(document.documentElement.dataset.labStylesheetState).toBe('none');
  });

  it('UIC-LABS-2.2 writes light or dark for the system theme, from the colour scheme', () => {
    const dark = { matchMedia: () => ({ matches: true }) } as unknown as Window;
    const light = { matchMedia: () => ({ matches: false }) } as unknown as Window;
    expect(resolveTheme('system', dark)).toBe('dark');
    expect(resolveTheme('system', light)).toBe('light');
    expect(resolveTheme('night', dark)).toBe('night');
    applySettings({ ...defaultSettings, theme: 'dark' });
    expect(document.documentElement.dataset.labScheme).toBe('dark');
    applySettings({ ...defaultSettings, theme: 'night' });
    expect(document.documentElement).toHaveAttribute('data-theme', 'night');
    expect(document.documentElement.dataset.labScheme).toBeUndefined();
  });

  it('UIC-LABS-2.5 makes the stylesheet hold the first paint', () => {
    applySettings(defaultSettings);
    expect(document.getElementById('ui-lab-stylesheet')).toHaveAttribute('blocking', 'render');
  });

  it('moves the theme between attributes', () => {
    applySettings({ ...defaultSettings, theme: 'dark' });
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    applySettings({ ...defaultSettings, theme: 'dark', themeAttribute: 'data-mode' });
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(document.documentElement).toHaveAttribute('data-mode', 'dark');
    applySettings({ ...defaultSettings, theme: '', themeAttribute: 'data-mode' });
    expect(document.documentElement).not.toHaveAttribute('data-mode');
  });
});
