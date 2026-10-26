import { useState, useSyncExternalStore } from 'react';
const closedSnapshot = Object.freeze({
    isOpen: false,
    anchor: null,
    items: undefined,
});
/** Whether an anchor is an element rather than a point. */
export function isElementAnchor(anchor) {
    return typeof anchor.getBoundingClientRect === 'function';
}
/** Creates a menu controller. Each controller drives one rendered menu. */
export function createMenuController() {
    let snapshot = closedSnapshot;
    const listeners = new Set();
    const publish = (next) => {
        if (next.isOpen === snapshot.isOpen &&
            next.anchor === snapshot.anchor &&
            next.items === snapshot.items) {
            return;
        }
        snapshot = Object.freeze(next);
        for (const listener of [...listeners])
            listener();
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
            if (snapshot.isOpen)
                publish({ ...snapshot, anchor });
        },
        setItems(items) {
            publish({ ...snapshot, items });
        },
        close() {
            if (snapshot.isOpen)
                publish({ ...snapshot, isOpen: false, anchor: null });
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
export function useMenuController() {
    const [controller] = useState(createMenuController);
    return controller;
}
/** Subscribes the calling component to a controller's state. */
export function useMenuControllerState(controller) {
    return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
}
//# sourceMappingURL=menu-controller.js.map