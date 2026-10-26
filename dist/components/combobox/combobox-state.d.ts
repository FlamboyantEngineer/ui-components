import { type ReactNode } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import { type ComboboxCompletion, type ComboboxItem } from './combobox-options.js';
import { type ComboboxLoader } from './combobox-search.js';
export interface InputTextOptions {
    inputValue?: string | undefined;
    defaultInputValue?: string | undefined;
    onInputChange?: ((text: string) => void) | undefined;
}
/** Where a combobox's suggestions come from and what its list shows. */
export interface ComboboxModelOptions extends OpenStateProps, InputTextOptions {
    items?: Iterable<ComboboxItem> | undefined;
    defaultItems?: Iterable<ComboboxItem> | undefined;
    loadItems?: ComboboxLoader | undefined;
    minSearchLength?: number | undefined;
    searchDelay?: number | undefined;
    isPending?: boolean | undefined;
    isDisabled?: boolean | undefined;
    isReadOnly?: boolean | undefined;
    onLoadMore?: (() => void) | undefined;
    isLoading?: boolean | undefined;
    renderEmptyState?: (() => ReactNode) | undefined;
}
/**
 * Inline completion: the completion the input shows, and a filter that matches options against what
 * the reader typed rather than that completion, with an accent- and case-insensitive `contains`. Off,
 * the building block filters with its own default.
 */
export declare function useInlineCompletionState({ completesInline, suggestions, }: {
    completesInline?: boolean | undefined;
    suggestions: Iterable<ComboboxItem>;
}): {
    defaultFilter: undefined;
    completion: null;
    field: null;
} | {
    defaultFilter: (text: string, input: string) => boolean;
    completion: ComboboxCompletion | null;
    field: {
        options: import("./combobox-options.js").ComboboxOption[];
        onComplete: import("react").Dispatch<import("react").SetStateAction<ComboboxCompletion | null>>;
    };
};
/**
 * The open state (controlled or held here), the input's text, and the suggestions: the caller's, or
 * with `loadItems` the latest search's once the text is long enough to search, with the loading row,
 * busy state and empty content that go with them.
 */
export declare function useComboboxModel(options: ComboboxModelOptions): {
    isOpen: boolean;
    onOpenChange: (next: boolean) => void;
    input: {
        text: string;
        onInputChange: (text: string) => void;
    };
    suggestions: Iterable<ComboboxItem>;
    /** The suggestions are the caller's filtered list or a search's results, never filtered here. */
    isControlled: boolean;
    isPending: boolean;
    loading: {
        onLoadMore?: undefined;
        isLoading?: undefined;
    } | {
        onLoadMore: (() => void) | undefined;
        isLoading: boolean | undefined;
    };
    renderEmpty: () => ReactNode;
};
//# sourceMappingURL=combobox-state.d.ts.map