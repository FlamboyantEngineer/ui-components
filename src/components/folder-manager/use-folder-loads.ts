import { useState } from 'react';
import type { Key } from 'react-aria-components';
import { useUiStrings } from '../../core/provider.js';

/** Where loading a folder's subfolders stands: loading, or failed with a message. */
type FolderLoad = 'loading' | { error: string };

export interface FolderLoads {
  /** Asks the owner for a folder's subfolders, unless they are loading already. */
  load: (key: Key) => void;
  isLoading: (key: Key) => boolean;
  /** Why loading a folder's subfolders failed, or `null`. */
  errorOf: (key: Key) => string | null;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Loading subfolders on demand, branch by branch: `onLoadChildren` may return a promise; while it
 * is pending the branch is loading, and a rejection keeps its message until the next attempt.
 */
export function useFolderLoads(onLoadChildren: ((key: Key) => unknown) | undefined): FolderLoads {
  const strings = useUiStrings();
  const [loads, setLoads] = useState<ReadonlyMap<Key, FolderLoad>>(() => new Map());
  const settle = (key: Key, next: FolderLoad | null) =>
    setLoads((current) => {
      const updated = new Map(current);
      if (next === null) updated.delete(key);
      else updated.set(key, next);
      return updated;
    });
  return {
    load(key) {
      if (!onLoadChildren || loads.get(key) === 'loading') return;
      settle(key, 'loading');
      Promise.resolve()
        .then(() => onLoadChildren(key))
        .then(
          () => settle(key, null),
          (error: unknown) => settle(key, { error: messageOf(error, strings.actionFailed) }),
        );
    },
    isLoading: (key) => loads.get(key) === 'loading',
    errorOf(key) {
      const entry = loads.get(key);
      return entry && entry !== 'loading' ? entry.error : null;
    },
  };
}
