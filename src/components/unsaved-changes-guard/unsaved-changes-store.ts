// The registrations of one unsaved changes guard (specs/UNSAVED-CHANGES-GUARD.md).

/** An action a registration runs when the reader saves or discards; a promise keeps it pending. */
export type UnsavedChangesAction = () => void | Promise<unknown>;

/** One registered source of changes, or a nested guard standing for its own sources. */
export interface UnsavedChangesEntry {
  isDirty: boolean;
  /** What the source is called in the confirmation's list. */
  labels: readonly string[];
  onSave?: UnsavedChangesAction | undefined;
  onDiscard?: UnsavedChangesAction | undefined;
}

/** Where a guard's registrations stand together. */
export interface UnsavedChangesSummary {
  isDirty: boolean;
  /** The labels of the dirty sources, in registration order. */
  labels: readonly string[];
  /** Every dirty source can save. */
  canSave: boolean;
}

export interface UnsavedChangesStore {
  /** Adds or replaces the registration under `key`. */
  set(key: string, entry: UnsavedChangesEntry): void;
  /** Removes the registration under `key`, and only it. */
  delete(key: string): void;
  /** The same object until the summary changes. */
  getSummary(): UnsavedChangesSummary;
  subscribe(listener: () => void): () => void;
  /**
   * Saves every dirty source, one after another; rejects with the first failure, or with an error
   * `isUnsavable` recognizes at a dirty source that cannot save.
   */
  save(): Promise<void>;
  /** Discards every dirty source, one after another. */
  discard(): Promise<void>;
}

const unsavable = Symbol('unsavable');

/** Whether Save stopped at a dirty source without `onSave`; nothing after it ran. */
export function isUnsavable(error: unknown): boolean {
  return error instanceof Error && error.cause === unsavable;
}

const cleanSummary: UnsavedChangesSummary = { isDirty: false, labels: [], canSave: false };

function summarize(entries: readonly UnsavedChangesEntry[]): UnsavedChangesSummary {
  if (entries.length === 0) return cleanSummary;
  return {
    isDirty: true,
    labels: entries.flatMap((entry) => entry.labels),
    canSave: entries.every((entry) => entry.onSave !== undefined),
  };
}

function isSameSummary(a: UnsavedChangesSummary, b: UnsavedChangesSummary): boolean {
  return (
    a.isDirty === b.isDirty &&
    a.canSave === b.canSave &&
    a.labels.length === b.labels.length &&
    a.labels.every((label, index) => label === b.labels[index])
  );
}

/**
 * Runs `run` on each dirty registration once, in registration order. The registrations are read
 * afresh before each one, so a removed source is skipped, a replaced one runs its current actions,
 * and one that became dirty meanwhile takes its turn.
 */
async function runInTurn(
  entries: ReadonlyMap<string, UnsavedChangesEntry>,
  run: (entry: UnsavedChangesEntry) => void | Promise<unknown>,
) {
  const done = new Set<string>();
  for (;;) {
    const next = [...entries].find(([key, entry]) => entry.isDirty && !done.has(key));
    if (!next) return;
    done.add(next[0]);
    await run(next[1]);
  }
}

function saveEntry(entry: UnsavedChangesEntry) {
  if (!entry.onSave) throw new Error('A dirty source cannot save.', { cause: unsavable });
  return entry.onSave();
}

/** A store of dirty registrations whose summary a guard subscribes to. */
export function createUnsavedChangesStore(): UnsavedChangesStore {
  const entries = new Map<string, UnsavedChangesEntry>();
  const listeners = new Set<() => void>();
  let summary = cleanSummary;
  const dirtyEntries = () => [...entries.values()].filter((entry) => entry.isDirty);
  const refresh = () => {
    const next = summarize(dirtyEntries());
    if (isSameSummary(next, summary)) return;
    summary = next;
    for (const listener of listeners) listener();
  };
  return {
    set(key, entry) {
      entries.set(key, entry);
      refresh();
    },
    delete(key) {
      entries.delete(key);
      refresh();
    },
    getSummary: () => summary,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    save: () => runInTurn(entries, saveEntry),
    discard: () => runInTurn(entries, (entry) => entry.onDiscard?.()),
  };
}
