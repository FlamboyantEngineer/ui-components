/** The values a field has shown, oldest first, and the one it shows now. */
export interface FieldHistory<T> {
    readonly entries: readonly T[];
    readonly index: number;
}
export declare function createFieldHistory<T>(value: T): FieldHistory<T>;
/** Adds `value` after the current entry, dropping redo entries; an unchanged value adds nothing. */
export declare function recordFieldHistory<T>(history: FieldHistory<T>, value: T): FieldHistory<T>;
/** Moves one entry back (`-1`) or forward (`1`); at either end the history is unchanged. */
export declare function stepFieldHistory<T>(history: FieldHistory<T>, step: -1 | 1): FieldHistory<T>;
export declare function canStepFieldHistory(history: FieldHistory<unknown>, step: -1 | 1): boolean;
//# sourceMappingURL=field-history.d.ts.map