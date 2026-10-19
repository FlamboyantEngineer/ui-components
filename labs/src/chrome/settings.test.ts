import { afterEach, describe, expect, it } from 'vitest';
import {
  applySettings,
  defaultSettings,
  readSettings,
  rememberSettings,
  settingsSearch,
} from './settings.js';

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
  for (const name of ['data-theme', 'data-mode']) document.documentElement.removeAttribute(name);
});

// UIC-LABS-2.1 UIC-LABS-2.2 UIC-LABS-2.3
describe('readSettings', () => {
  it('defaults to the reference sheet and no theme', () => {
    expect(readSettings('', memoryStorage())).toEqual(defaultSettings);
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
    expect(readSettings('', throwingStorage)).toEqual(defaultSettings);
    expect(() => rememberSettings(defaultSettings, throwingStorage)).not.toThrow();
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
    expect(settingsSearch(defaultSettings, '?case=3')).toBe('?case=3&stylesheet=reference');
    expect(
      settingsSearch({ stylesheet: { kind: 'none' }, theme: 'dark', themeAttribute: 'data-mode' }),
    ).toBe('?stylesheet=none&theme=dark&themeAttribute=data-mode');
  });
});

describe('applySettings', () => {
  it('UIC-LABS-2.1 reports an invalid stylesheet URL and recovers on the next choice', () => {
    applySettings(defaultSettings);
    applySettings({
      ...defaultSettings,
      stylesheet: { kind: 'custom', url: 'http://[' },
      theme: 'dark',
    });
    expect(document.documentElement.dataset.labStylesheetState).toBe('error');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
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
    expect(link.getAttribute('href')).toBe('build/reference.css');
    expect(document.documentElement.dataset.labStylesheetState).toBe('loading');

    applySettings({ ...defaultSettings, stylesheet: { kind: 'custom', url: '/host.css' } });
    expect(document.getElementById('ui-lab-stylesheet')?.getAttribute('href')).toBe('/host.css');

    applySettings({ ...defaultSettings, stylesheet: { kind: 'none' } });
    expect(document.getElementById('ui-lab-stylesheet')).toBeNull();
    expect(document.documentElement.dataset.labStylesheetState).toBe('none');
  });

  it('moves the theme between attributes', () => {
    applySettings({ ...defaultSettings, theme: 'dark' });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applySettings({ ...defaultSettings, theme: 'dark', themeAttribute: 'data-mode' });
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    applySettings({ ...defaultSettings, theme: '', themeAttribute: 'data-mode' });
    expect(document.documentElement.getAttribute('data-mode')).toBeNull();
  });
});
