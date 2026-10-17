import { useState, useSyncExternalStore } from 'react';
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
 * Open state and anchor of one menu, readable and drivable from outside React. A `ControlledMenu`
 * (or a `ContextMenuTrigger` given the controller) renders the menu; anything else may open, move
 * or close it and subscribe to its state.
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

const closedSnapshot: MenuControllerSnapshot = Object.freeze({
  isOpen: false,
  anchor: null,
  items: undefined,
});

/** Whether an anchor is an element rather than a point. */
export function isElementAnchor(anchor: MenuAnchor): anchor is Element {
  return typeof (anchor as Element).getBoundingClientRect === 'function';
}

/** Creates a menu controller. Each controller drives one rendered menu. */
export function createMenuController(): MenuController {
  let snapshot = closedSnapshot;
  const listeners = new Set<() => void>();

  const publish = (next: MenuControllerSnapshot) => {
    if (
      next.isOpen === snapshot.isOpen &&
      next.anchor === snapshot.anchor &&
      next.items === snapshot.items
    ) {
      return;
    }
    snapshot = Object.freeze(next);
    for (const listener of [...listeners]) listener();
  };

  return {
    open(anchor, options = {}) {
      publish({
        isOpen: true,
        anchor,
        items: 'items' in options ? options.items : snapshot.items,
      });
    },
    move(anchor) {
      if (snapshot.isOpen) publish({ ...snapshot, anchor });
    },
    setItems(items) {
      publish({ ...snapshot, items });
    },
    close() {
      if (snapshot.isOpen) publish({ ...snapshot, isOpen: false, anchor: null });
    },
    isOpen: () => snapshot.isOpen,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** A controller that lives as long as the calling component. */
export function useMenuController(): MenuController {
  const [controller] = useState(createMenuController);
  return controller;
}

/** Subscribes the calling component to a controller's state. */
export function useMenuControllerState(controller: MenuController): MenuControllerSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
}
