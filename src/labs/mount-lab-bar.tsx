'use client';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { enableShadowRoots } from '../components/portal/index.js';
import { LabBar } from './lab-bar.js';
import { labBarStyles } from './lab-bar-styles.js';
import {
  applySettings,
  type LabSettings,
  type LabSettingsOptions,
  readSettings,
  rememberSettings,
  settingsSearch,
  watchColorScheme,
} from './lab-settings.js';

export interface MountLabBarOptions extends LabSettingsOptions {
  /** The element the bar renders into, in a shadow root of its own. */
  host: HTMLElement;
  /** The page's name, shown in the bar. */
  title: string;
  /** The lab index the bar links to, carrying the settings; null on the index itself. */
  indexHref: string | null;
  /** Receives the settings and their query string when the bar mounts and after every change. */
  onSettingsChange?: ((settings: LabSettings, search: string) => void) | undefined;
}

/** Gives `shadow` the bar's stylesheet, adopted where the browser can, else as a style element. */
function adoptBarStyles(shadow: ShadowRoot) {
  if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet === 'function') {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(labBarStyles);
    shadow.adoptedStyleSheets = [sheet];
    return;
  }
  const style = document.createElement('style');
  style.textContent = labBarStyles;
  shadow.append(style);
}

/**
 * Applies `initial` now and again whenever the reader's colour scheme changes, which a system theme
 * follows, and draws the bar in the scheme a light or dark theme sets. Returns the setter for the
 * settings it applies.
 */
function applyFollowingScheme(
  initial: LabSettings,
  { host, referenceStylesheet }: Pick<MountLabBarOptions, 'host' | 'referenceStylesheet'>,
) {
  let current = initial;
  const apply = () => {
    applySettings(current, referenceStylesheet);
    const scheme = document.documentElement.dataset.labScheme;
    if (scheme) host.dataset.labScheme = scheme;
    else delete host.dataset.labScheme;
  };
  apply();
  watchColorScheme(apply);
  return (next: LabSettings) => {
    current = next;
    apply();
  };
}

/**
 * Reads the settings from the query string and `storage`, applies them and renders the lab bar into
 * `host`. Every change the reader makes is applied, remembered in `storage` and written to the
 * page's query string. Returns the settings it started from.
 */
export function mountLabBar(options: MountLabBarOptions): LabSettings {
  const { host, title, indexHref, storage, onSettingsChange } = options;
  const initial = readSettings(location.search, storage);
  const apply = applyFollowingScheme(initial, options);
  host.setAttribute('aria-label', 'Lab settings');
  // The bar's segmented choice presses and moves focus across the shadow boundary.
  enableShadowRoots();
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  adoptBarStyles(shadow);
  const container = document.createElement('div');
  shadow.append(container);

  const change = (settings: LabSettings) => {
    apply(settings);
    rememberSettings(settings, storage);
    history.replaceState(
      null,
      '',
      `${location.pathname}${settingsSearch(settings, location.search)}${location.hash}`,
    );
    onSettingsChange?.(settings, settingsSearch(settings));
  };
  onSettingsChange?.(initial, settingsSearch(initial));

  createRoot(container).render(
    <StrictMode>
      <LabBar title={title} defaultSettings={initial} indexHref={indexHref} onChange={change} />
    </StrictMode>,
  );
  return initial;
}
