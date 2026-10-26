/** Receives a new value; a returned promise holds the change pending until it settles. */
export type PendingChangeHandler<T> = (value: T) => void | Promise<unknown>;
export interface PendingChange<T> {
    /** The value shown: the pending one while a change settles, else the value in effect. */
    value: T;
    /** A change waits for the promise its handler returned. */
    isPending: boolean;
    /** Reports a new value; ignored while another change is pending. */
    change: (next: T) => void;
}
/**
 * A value the caller may control whose change may settle later. When `onChange` returns a promise,
 * the new value shows at once and stays pending until the promise settles: fulfilled, it takes
 * effect (an uncontrolled value keeps it); rejected, the value in effect shows again.
 */
export declare function usePendingChange<T>(value: T | undefined, defaultValue: T, onChange?: PendingChangeHandler<T> | undefined): PendingChange<T>;
//# sourceMappingURL=pending-change.d.ts.map