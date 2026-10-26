import { type RefObject } from 'react';
import type { IconSource } from '../icon/icon.js';
import type { ShortcutProps } from '../shortcut/shortcut.js';
import type { ComposerFrameModel } from './composer-frame.js';
import type { MessageComposerToken } from './composer-message.js';
/** What a menu item's action can do with the composer. */
export interface MessageComposerHelpers {
    /** Inserts text at the caret in place of the selection; focus returns after it once the menu closes. */
    insertText: (text: string) => void;
    /**
     * Inserts a mention, command or record reference at the caret, followed by a space: a pill or a
     * record chip in the rich composer (its text in a code block), its text (`@label`, `/label`,
     * `label`) in the plain composer. Focus returns after it once the menu closes.
     */
    insertPill: (pill: Pick<MessageComposerToken, 'kind' | 'id' | 'label' | 'recordType'>) => void;
    /** Opens the system file chooser for several files; the chosen files go to `onAttach`, without which it does nothing. */
    attachFiles: () => void;
    /** Moves focus to the input once the menu closes. */
    focusInput: () => void;
}
/** An item of the composer's menu. */
export interface MessageComposerMenuItem {
    /** Identifies the item; unique within the menu, sections included. */
    id: string;
    /** The item's name. */
    label: string;
    /** A note after the label, such as what the item does or where it comes from. */
    description?: string | undefined;
    /** Drawn before the label: a built-in glyph name or any icon node. */
    icon?: IconSource;
    /** A keyboard chord shown at the end of the row, for a shortcut the host handles itself. */
    shortcut?: ShortcutProps['chord'] | undefined;
    /** Keeps the item listed but out of reach; the arrow keys still reach it. */
    isDisabled?: boolean | undefined;
    /** Why a disabled item is unavailable, shown in place of its description. */
    disabledReason?: string | undefined;
    /** Makes the item a toggle, on while true; flipping it keeps the menu open. */
    isSelected?: boolean | undefined;
    /** Called with the toggle's new state when the reader flips it. */
    onSelectedChange?: ((isSelected: boolean) => void) | undefined;
    /** Nested items, which the item opens as a submenu instead of acting. */
    items?: readonly MessageComposerMenuItem[] | undefined;
    /** Called with the composer's helpers when the reader chooses the item. */
    onAction?: ((composer: MessageComposerHelpers) => void) | undefined;
}
/** A category of the composer's menu: a heading over its items. */
export interface MessageComposerMenuSection {
    /** Identifies the section; unique within the menu, items included. */
    id: string;
    /** The heading, which also names the group. */
    title: string;
    items: readonly MessageComposerMenuItem[];
}
/** The composer's "+" menu. */
export interface MessageComposerMenu {
    /** The categories, in order. */
    sections: readonly MessageComposerMenuSection[];
    /** Leads the menu with a search field that narrows the items by label and description. */
    filterable?: boolean | undefined;
}
export interface ComposerMenuProps {
    menu: MessageComposerMenu;
    /** The composer's root, which the menu opens against. */
    anchorRef: RefObject<HTMLElement | null>;
    model: Pick<ComposerFrameModel, 'insertText' | 'insertPill' | 'focusInput'>;
    onAttach: ((files: File[]) => void) | undefined;
    isDisabled: boolean;
}
/**
 * The "+" button at the start of the toolbar and the menu it opens above the composer: the host's
 * sections of items, optionally led by a search field. Insertions take focus back to the input once
 * the menu has closed and given focus back to the button. The file chooser behind `attachFiles` is a
 * hidden file input, since the press that opens it is the host's menu item rather than a button.
 */
export declare function ComposerMenu({ menu, anchorRef, model, onAttach, isDisabled }: ComposerMenuProps): import("react").JSX.Element;
//# sourceMappingURL=composer-menu.d.ts.map