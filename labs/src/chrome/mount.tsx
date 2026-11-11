import { type ReactNode, StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { UiProvider, type UiProviderProps } from '../../../src/core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../../src/core/storage.js';
import { type LabSettings, mountLabBar } from '../../../src/labs/index.js';
import { labStorage } from './settings.js';

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

function mountBar(
  index: boolean,
  onSettingsChange?: (settings: LabSettings, search: string) => void,
) {
  const host = document.getElementById('lab-chrome');
  if (!host) throw new Error('Lab page is missing #lab-chrome');
  mountLabBar({
    host,
    title: index ? 'Labs' : readPageTitle(),
    indexHref: index ? null : 'index.html',
    storage: labStorage(),
    onSettingsChange,
  });
}

function Ready({ children }: { children: ReactNode }) {
  useEffect(markReady, []);
  return children;
}

/** Applies the stylesheet and theme, mounts the chrome, and renders the lab content into #lab-root. */
export function mountLab(content: ReactNode, options: MountLabOptions = {}): void {
  mountBar(false);

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
  mountBar(true, (_settings, search) => {
    for (const link of document.querySelectorAll<HTMLAnchorElement>('#lab-index a[href]')) {
      const page = link.getAttribute('href')?.split('?')[0] ?? '';
      link.setAttribute('href', `${page}${search}`);
    }
  });
  markReady();
}
