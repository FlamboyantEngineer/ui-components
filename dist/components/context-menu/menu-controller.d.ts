import type { MenuEntry } from '../menu/menu.js';
/** A viewport point, in CSS pixels from the top-left of the window (for example a pointer position). */
export interface MenuPoint {
    x: number;
    y: number;
}
/** Where a menu opens: at a viewport point, or below an element. */
export type MenuAnchor = MenuPoint | Element;
export interface MenuOpenOptions {
    /** Entries for this opening, used when the menu has no children of its own. */
    items?: readonly MenuEntry[] | undefined;
}
export interface MenuControllerSnapshot {
    readonly isOpen: boolean;
    /** The current anchor, or null while closed. */
    readonly anchor: MenuAnchor | null;
    /** Entries passed to `open` or `setItems`, if any. */
    readonly items: readonly MenuEntry[] | undefined;
}
/**
 * Open state and anchor of one menu, readable and drivable from outside React. A `ContextMenu`
 * renders the menu; anything else may open, move or close it and subscribe to its state.
 */
export interface MenuController {
    /** Opens the menu at a point or below an element. Opening an open menu moves it instead. */
    open(anchor: MenuAnchor, options?: MenuOpenOptions): void;
    /** Moves an open menu to a new anchor without reopening it or moving focus. */
    move(anchor: MenuAnchor): void;
    /** Replaces the entries of the menu, open or not. */
    setItems(items: readonly MenuEntry[] | undefined): void;
    close(): void;
    isOpen(): boolean;
    getSnapshot(): MenuControllerSnapshot;
    /** Calls `listener` after every change; returns the unsubscribe function. */
    subscribe(listener: () => void): () => void;
}
/** Whether an anchor is an element rather than a point. */
export declare function isElementAnchor(anchor: MenuAnchor): anchor is Element;
/** Creates a menu controller. Each controller drives one rendered menu. */
export declare function createMenuController(): MenuController;
/** A controller that lives as long as the calling component. */
export declare function useMenuController(): MenuController;
/** Subscribes the calling component to a controller's state. */
export declare function useMenuControllerState(controller: MenuController): MenuControllerSnapshot;
//# sourceMappingURL=menu-controller.d.ts.map