import { type ReactNode, StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { UiProvider, type UiProviderProps } from '../../../src/core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../../src/core/storage.js';
import { chromeStyles, LabChrome } from './lab-chrome.js';
import {
  applySettings,
  type LabSettings,
  labStorage,
  readSettings,
  rememberSettings,
  settingsSearch,
  watchColorScheme,
} from './settings.js';

export interface MountLabOptions {
  /** Provider props for the lab content, e.g. replaced glyphs or strings. */
  provider?: Omit<UiProviderProps, 'children'>;
}

const statePrefix = 'ui-labs-state:';

/** Persisted lab component state lives in localStorage under its own prefix. */
function createLabUiStorage(): UiStorage {
  const storage = labStorage();
  if (!storage) return createMemoryStorage();
  return {
    getItem: (key) => storage.getItem(statePrefix + key),
    setItem: (key, value) => storage.setItem(statePrefix + key, value),
    removeItem: (key) => storage.removeItem(statePrefix + key),
  };
}

function readPageTitle(): string {
  return document.title.replace(/ · Labs$/, '');
}

function readPageDescription(): string {
  return document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
}

function markReady() {
  document.documentElement.dataset.labReady = 'true';
}

/**
 * Applies `settings` now and again whenever the reader's colour scheme changes, which a system
 * theme follows, and draws the chrome in the scheme a light or dark theme sets.
 */
function applyFollowingScheme(initial: LabSettings) {
  let current = initial;
  const apply = () => {
    applySettings(current);
    const host = document.getElementById('lab-chrome');
    host?.style.setProperty('color-scheme', document.documentElement.dataset.labScheme ?? null);
  };
  apply();
  watchColorScheme(apply);
  return (next: LabSettings) => {
    current = next;
    apply();
  };
}

/** Mounts the chrome in a shadow root so neither the chosen stylesheet nor the lab can restyle it. */
function mountChrome(
  initial: LabSettings,
  onSettings: (settings: LabSettings) => void,
  index: boolean,
) {
  const apply = applyFollowingScheme(initial);
  const host = document.getElementById('lab-chrome');
  if (!host) throw new Error('Lab page is missing #lab-chrome');
  host.setAttribute('aria-label', 'Lab settings');
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet === 'function') {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(chromeStyles);
    shadow.adoptedStyleSheets = [sheet];
  } else {
    const style = document.createElement('style');
    style.textContent = chromeStyles;
    (shadow as ShadowRoot).append(style);
  }
  const container = document.createElement('div');
  (shadow as ShadowRoot).append(container);

  const change = (settings: LabSettings) => {
    apply(settings);
    rememberSettings(settings, labStorage());
    history.replaceState(
      null,
      '',
      `${location.pathname}${settingsSearch(settings, location.search)}${location.hash}`,
    );
    onSettings(settings);
  };

  createRoot(container).render(
    <StrictMode>
      <LabChrome
        title={index ? 'Labs' : readPageTitle()}
        initial={initial}
        indexHref={index ? null : (settings) => `index.html${settingsSearch(settings)}`}
        onChange={change}
      />
    </StrictMode>,
  );
}

function Ready({ children }: { children: ReactNode }) {
  useEffect(markReady, []);
  return children;
}

/** Applies the stylesheet and theme, mounts the chrome, and renders the lab content into #lab-root. */
export function mountLab(content: ReactNode, options: MountLabOptions = {}): void {
  const settings = readSettings(location.search, labStorage());
  mountChrome(settings, () => {}, false);

  const root = document.getElementById('lab-root');
  if (!root) throw new Error('Lab page is missing #lab-root');
  const description = readPageDescription();
  createRoot(root).render(
    <StrictMode>
      <UiProvider storage={createLabUiStorage()} {...options.provider}>
        <Ready>
          <h1>{readPageTitle()}</h1>
          {description ? <p>{description}</p> : null}
          {content}
        </Ready>
      </UiProvider>
    </StrictMode>,
  );
}

/** The index page: chrome plus links that carry the current settings into each lab. */
export function mountIndex(): void {
  const settings = readSettings(location.search, labStorage());
  const updateLinks = (next: LabSettings) => {
    for (const link of document.querySelectorAll<HTMLAnchorElement>('#lab-index a[href]')) {
      const page = link.getAttribute('href')?.split('?')[0] ?? '';
      link.setAttribute('href', `${page}${settingsSearch(next)}`);
    }
  };
  updateLinks(settings);
  mountChrome(settings, updateLinks, true);
  markReady();
}
