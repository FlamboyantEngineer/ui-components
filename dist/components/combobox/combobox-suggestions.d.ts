import { type ReactNode, type RefObject } from 'react';
import type { ControlSize } from '../../core/props.js';
import { type ComboboxCompletion, type ComboboxItem, type ComboboxOption } from './combobox-options.js';
/** The state of an option row that `renderOption` draws for. */
export interface ComboboxOptionState {
    /** The option is picked. */
    isSelected: boolean;
    /** The option is highlighted, from the keyboard or the pointer. */
    isFocused: boolean;
    /** The option is highlighted from the keyboard. */
    isFocusVisible: boolean;
    /** The pointer is over the option. */
    isHovered: boolean;
    /** The option is being pressed. */
    isPressed: boolean;
    /** The option cannot be picked. */
    isDisabled: boolean;
}
/** Draws an option's content in the list, from the option and its row's state. */
export type ComboboxOptionRenderer = (option: ComboboxOption, state: ComboboxOptionState) => ReactNode;
/** How the list draws its options. */
export interface ComboboxOptionDisplay {
    /** Marks the typed text in option labels. */
    highlightMatches?: boolean | undefined;
    renderOption?: ComboboxOptionRenderer | undefined;
}
export interface ComboboxSuggestionsProps extends ComboboxOptionDisplay {
    size: ControlSize;
    /** The suggestions, in display order. */
    items: Iterable<ComboboxItem>;
    /** Renders only the options in view. */
    virtualized?: boolean | undefined;
    /** Ends the list with an action row that adds the typed text, while no option has it as label. */
    onCreateOption?: ((text: string) => void) | undefined;
    /** The loading row at the end of the list, shown when either is set. */
    loading: {
        onLoadMore?: (() => void) | undefined;
        isLoading?: boolean | undefined;
    };
    /** Highlight the first enabled option while the list is open. */
    autoHighlight?: boolean | undefined;
    /** The input's text. */
    inputText: string;
    /** The inline completion the input shows, if any. */
    completion: ComboboxCompletion | null;
    /** Holds the text the add row last created until the input shows the selected option. */
    createdRef: RefObject<string | null>;
    /** The content of the list while it holds no option. */
    renderEmpty: () => ReactNode;
    /** Controls drawn above the listbox. */
    listHeader: ReactNode;
    /** The input, which takes focus back after a press in the list header. */
    inputRef: RefObject<HTMLInputElement | null>;
    /** Whether the list is open, as the combobox's open state says. */
    isOpen: boolean;
}
/**
 * The suggestion list: the list header, then a listbox of options and sections, then the add row and
 * the loading row, or the empty content, in a popover on the `dropdown` layer that publishes the
 * field's width as `--ui-trigger-width`. It also keeps an option highlighted when asked and holds the building
 * block's open state to the combobox's.
 */
export declare function ComboboxSuggestions(props: ComboboxSuggestionsProps): import("react").JSX.Element;
//# sourceMappingURL=combobox-suggestions.d.ts.map