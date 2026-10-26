import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
/** What `renderEditor` receives to draw the editor of an inline edit. */
export interface InlineEditEditorProps<T> {
    /** The value being edited. */
    value: T;
    /** Changes the value being edited. */
    onChange: (value: T) => void;
    /** Saves the value being edited, or `value` when given, and closes the editor once saved. */
    commit: (value?: T) => void;
    /** Closes the editor without saving. */
    cancel: () => void;
    /** The inline edit's label, which names the editor's control. */
    label: string;
    /** A save is running. */
    isPending: boolean;
}
export interface InlineEditProps<T = string> extends BaseProps {
    /** The saved value, shown in the read view. */
    value: T;
    /**
     * Saves a changed value. A returned promise keeps the editor open and pending until it settles;
     * a rejection keeps it open with the rejection's message.
     */
    onSave: (value: T) => void | Promise<unknown>;
    /** Names the value: the read view reads as "Edit" and the label, and it names the editor. */
    label: string;
    /** Draws the value in the read view. Defaults to the value as text. */
    renderValue?: ((value: T) => ReactNode) | undefined;
    /** Draws the editor. Defaults to a one-line text field, for a text value. */
    renderEditor?: ((props: InlineEditEditorProps<T>) => ReactNode) | undefined;
    /** Shown in the read view while the value is empty. */
    placeholder?: ReactNode;
    /** Draws save and cancel buttons after the editor. */
    showActions?: boolean | undefined;
    /** Whether the editor is open, controlled. */
    isEditing?: boolean | undefined;
    /** Whether the editor is open at first, uncontrolled. */
    defaultEditing?: boolean | undefined;
    /** Called when the editor opens or closes. */
    onEditingChange?: ((isEditing: boolean) => void) | undefined;
    /** Keeps the value read only: the read view does not open the editor. */
    isDisabled?: boolean | undefined;
}
/**
 * A value read in place that turns into its editor where it stands: a click, Enter, Space or F2 on
 * the read view opens the editor; Enter or focus leaving it saves, and Escape cancels. A save may be
 * asynchronous: the editor stays open and pending until it settles, and shows why it failed.
 */
export declare function InlineEdit<T = string>(props: InlineEditProps<T>): import("react").JSX.Element;
//# sourceMappingURL=inline-edit.d.ts.map