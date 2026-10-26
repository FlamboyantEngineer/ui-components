import { type FocusEvent, type KeyboardEvent } from 'react';
export interface InlineEditStateOptions<T> {
    value: T;
    onSave: (value: T) => void | Promise<unknown>;
    isEditing: boolean | undefined;
    defaultEditing: boolean;
    onEditingChange: ((isEditing: boolean) => void) | undefined;
    /** The message of a failed save that carries none of its own. */
    failureMessage: string;
}
/** Whether two plain-data values are the same, so saving would change nothing. */
export declare function isSameValue(a: unknown, b: unknown): boolean;
/**
 * The editing state of an inline edit: the editor opens from the read view, holds the value being
 * edited, saves it (waiting on a returned promise and keeping the editor open with the message of a
 * failure) and closes, moving focus in and back out.
 */
export declare function useInlineEdit<T>(options: InlineEditStateOptions<T>): {
    isEditing: boolean;
    isPending: boolean;
    error: string | null;
    current: T;
    setCurrent: (next: T) => void;
    open: () => void;
    cancel: () => void;
    commit: (next?: T) => undefined;
    editorHandlers: {
        onKeyDownCapture: (event: KeyboardEvent<HTMLDivElement>) => void;
        onFocus: () => void;
        onBlur: (event: FocusEvent<HTMLDivElement>) => void;
    };
    editorRef: import("react").RefObject<HTMLDivElement | null>;
    readRef: import("react").RefObject<HTMLButtonElement | null>;
};
//# sourceMappingURL=use-inline-edit.d.ts.map