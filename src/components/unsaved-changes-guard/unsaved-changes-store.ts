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
  /** Saves every dirty source, one after another; rejects with the first failure. */
  save(): Promise<void>;
  /** Discards every dirty source, one after another. */
  discard(): Promise<void>;
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
    async save() {
      for (const entry of dirtyEntries()) await entry.onSave?.();
    },
    async discard() {
      for (const entry of dirtyEntries()) await entry.onDiscard?.();
    },
  };
}
