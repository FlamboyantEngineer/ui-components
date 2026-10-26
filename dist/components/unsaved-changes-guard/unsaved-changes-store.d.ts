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
/** A store of dirty registrations whose summary a guard subscribes to. */
export declare function createUnsavedChangesStore(): UnsavedChangesStore;
//# sourceMappingURL=unsaved-changes-store.d.ts.map