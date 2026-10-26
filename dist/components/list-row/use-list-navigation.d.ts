import { type FocusEvent, type KeyboardEvent, type Ref } from 'react';
import type { ListHandle } from './list-row.js';
export interface ListNavigationOptions {
    /** The class of the rows' primary controls, the elements navigation moves between. */
    primaryClass: string;
    /** Called on ArrowUp from the first row. */
    onNavigatePastStart?: (() => void) | undefined;
    /** Receives `focusFirst()`. */
    handleRef?: Ref<ListHandle> | undefined;
    /** The caller's ref to the `<ul>`. */
    ref?: Ref<HTMLUListElement> | undefined;
}
/** How rows join a list's single tab stop. */
export interface RowRegistry {
    register(id: string, node: HTMLElement): () => void;
    subscribe(id: string, listener: () => void): () => void;
    getActiveId(): string | null;
    activate(id: string): void;
}
/** What a list puts on its `<ul>` and gives its rows. */
export interface ListNavigation {
    registry: RowRegistry;
    setRef: (node: HTMLUListElement | null) => void;
    onKeyDown: (event: KeyboardEvent<HTMLUListElement>) => void;
    onBlurCapture: (event: FocusEvent<HTMLUListElement>) => void;
}
/** A row's share of its list's single tab stop. */
export interface RowTabStop {
    /** Whether the row's primary control holds the tab stop. */
    isActive: boolean;
    /** The ref callback for the row's primary control. */
    setPrimary: (node: HTMLElement | null) => void;
    /** Makes the row the tab stop, when focus enters it. */
    activate: () => void;
}
export declare const RowRegistryContext: import("react").Context<RowRegistry | null>;
/**
 * A list's single tab stop and arrow navigation: ArrowUp, ArrowDown, Home and End move focus between
 * the registered rows' primary controls in document order, and focus recovers when a row goes.
 */
export declare function useListNavigation({ primaryClass, onNavigatePastStart, handleRef, ref, }: ListNavigationOptions): ListNavigation;
/**
 * A row's place in its list's single tab stop, registered while it is enabled. Outside a `List`
 * every row is its own tab stop. `primaryKind` re-registers the row when its primary control changes.
 */
export declare function useRowTabStop(isDisabled: boolean, primaryKind: string): RowTabStop;
//# sourceMappingURL=use-list-navigation.d.ts.map