import { type PersistCodec } from '../../core/provider.js';
export interface NavigationRailState {
    /** The rail shows icons only. */
    isCollapsed: boolean;
    /** Expands a collapsed rail, as pressing a group in it does. */
    expand: () => void;
}
/** Counts the current items inside a group, so the group can say it holds the current page. */
export type CurrentItemRegistry = () => () => void;
export interface PersistedValueOptions<T> {
    /** The controlled value, which storage never overrides. */
    value: T | undefined;
    defaultValue: T;
    onChange?: ((value: T) => void) | undefined;
    /** Where the uncontrolled value persists. */
    persistKey: string | undefined;
    /** Reads and writes the stored value; a stored value it cannot read gives the default. */
    codec: PersistCodec<T>;
}
export declare const navigationRailHooks: import("../../core/hooks.js").ComponentHooks<"body" | "footer" | "header" | "label" | "link" | "section" | "toggle" | "count" | "group" | "list" | "icon" | "item" | "indicator" | "resize-handle" | "section-title" | "monogram" | "group-trigger" | "group-panel">;
/** The stored collapsed state: a boolean. */
export declare const collapsedCodec: PersistCodec<boolean>;
/** The stored width: a finite number of pixels. */
export declare const widthCodec: PersistCodec<number>;
export declare const NavigationRailContext: import("react").Context<NavigationRailState>;
export declare const CurrentItemContext: import("react").Context<CurrentItemRegistry | null>;
/**
 * A value the caller may control that otherwise persists through the provider storage under
 * `persistKey`. Every change is reported through `onChange`.
 */
export declare function usePersistedValue<T>({ value, defaultValue, onChange, persistKey, codec, }: PersistedValueOptions<T>): [T, (next: T) => void];
/** Tells the enclosing group, while `isCurrent` holds, that it holds a current item. */
export declare function useReportCurrent(isCurrent: boolean): void;
/** A registry for the current items below a group, and whether it holds any. */
export declare function useCurrentItems(): [boolean, CurrentItemRegistry];
//# sourceMappingURL=navigation-rail-state.d.ts.map