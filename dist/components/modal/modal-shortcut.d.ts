import type { KeyboardEvent } from 'react';
interface ShortcutEvent {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    repeat?: boolean | undefined;
    isComposing?: boolean | undefined;
    defaultPrevented?: boolean | undefined;
}
/**
 * Whether a key press is the modal's primary-action shortcut: Enter with exactly one of Control or
 * Command, no other modifier, not repeated, not composing text and not already handled.
 */
export declare function isModalPrimaryShortcut(event: ShortcutEvent): boolean;
/**
 * Claims a key press for the innermost modal that hears it, and tells whether it is the primary-
 * action shortcut pressed outside a multiline editor. A press another modal claimed is not.
 */
export declare function claimPrimaryShortcut(event: KeyboardEvent<HTMLElement>): boolean;
export {};
//# sourceMappingURL=modal-shortcut.d.ts.map