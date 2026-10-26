import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type UnsavedChangesAction } from './unsaved-changes-store.js';
export interface UnsavedChangesGuardProps extends BaseProps {
    children?: ReactNode;
    /** Titles the confirmation. Defaults to the provider's `unsavedChanges` string. */
    title?: ReactNode;
    /** The question. Defaults to the provider's `saveBeforeLeaving` or `discardBeforeLeaving` string. */
    message?: ReactNode;
    /** Asks the browser to confirm closing or reloading the page while anything is dirty. Defaults to true. */
    shouldConfirmUnload?: boolean | undefined;
}
export interface UnsavedChangesOptions {
    /** Whether the source holds changes that leaving would lose. */
    isDirty: boolean;
    /** Names the source in the confirmation's list of what is unsaved. */
    label?: string | undefined;
    /** Saves the changes; a returned promise keeps Save pending, and a rejection keeps the reader here. */
    onSave?: UnsavedChangesAction | undefined;
    /** Throws the changes away. */
    onDiscard?: UnsavedChangesAction | undefined;
}
/** Overrides the guard's text for one confirmation. */
export interface ConfirmLeaveOptions {
    title?: ReactNode;
    message?: ReactNode;
}
export interface UnsavedChangesGuardState {
    /** Whether any source under the guard is dirty. */
    isDirty: boolean;
    /**
     * Resolves `true` at once when nothing is dirty; otherwise asks the reader and resolves `true`
     * after they save or discard, `false` when they stay.
     */
    confirmLeave: (options?: ConfirmLeaveOptions) => Promise<boolean>;
}
/**
 * Protects unsaved edits. Editors under it register with `useUnsavedChanges`; code that leaves
 * (a route change, a tab switch, closing a panel) awaits `confirmLeave()` from
 * `useUnsavedChangesGuard`, which asks the reader to save, discard or stay while anything is dirty.
 * The browser confirms closing the page meanwhile. A guard inside another stands in its parent for
 * the sources under it, so a panel can ask about its own edits alone.
 */
export declare function UnsavedChangesGuard({ children, shouldConfirmUnload, ...rest }: UnsavedChangesGuardProps): import("react").JSX.Element;
/**
 * Registers an editor's changes with the nearest `UnsavedChangesGuard` while it is mounted: whether
 * they are dirty, what to call them, and how to save or discard them.
 */
export declare function useUnsavedChanges({ isDirty, label, onSave, onDiscard }: UnsavedChangesOptions): void;
/** The nearest `UnsavedChangesGuard`'s dirty state and its `confirmLeave`. */
export declare function useUnsavedChangesGuard(): UnsavedChangesGuardState;
//# sourceMappingURL=unsaved-changes-guard.d.ts.map