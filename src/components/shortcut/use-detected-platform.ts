'use client';

import { useSyncExternalStore } from 'react';
import { getShortcutPlatform, type ShortcutPlatform } from './shortcut-format.js';

const subscribeToNothing = () => () => {};
/** What detection reports without a browser, so the server and hydration render the same notation. */
const getServerPlatform = (): ShortcutPlatform => 'linux';

/** The detected platform: the server's notation while hydrating, the browser's once hydrated. */
export function useDetectedPlatform(): ShortcutPlatform {
  return useSyncExternalStore(subscribeToNothing, getShortcutPlatform, getServerPlatform);
}
