import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useLayoutEffect, useState, useSyncExternalStore, } from 'react';
import { Modal } from '../modal/modal.js';
function ModalHostEntry({ entry }) {
    const handle = entry.handle;
    const onOpenChange = useCallback((isOpen) => {
        if (!isOpen)
            handle.close();
    }, [handle]);
    const options = entry.options;
    if ('render' in options) {
        return options.render({ isOpen: true, onOpenChange, close: handle.close, handle });
    }
    const { content, ...modalProps } = options;
    return (_jsx(Modal, { ...modalProps, isOpen: true, onOpenChange: onOpenChange, children: typeof content === 'function' ? content(handle) : content }));
}
/**
 * Creates a modal controller. The host creates one, renders `<ModalHost controller={…} />` once, and
 * passes the controller to whatever opens modals. Modals opened before the host mounts appear when it
 * does, in opening order.
 */
export function createModalController() {
    let entries = [];
    let nextId = 0;
    const listeners = new Set();
    const publish = () => {
        for (const listener of [...listeners])
            listener();
    };
    function open(initial) {
        nextId += 1;
        const id = `modal-${nextId}`;
        let isOpen = true;
        let settle;
        const result = new Promise((resolve) => {
            settle = resolve;
        });
        const handle = {
            id,
            get isOpen() {
                return isOpen;
            },
            result,
            close(value) {
                if (!isOpen)
                    return;
                isOpen = false;
                entries = entries.filter((entry) => entry.id !== id);
                publish();
                settle(value);
            },
            update(options) {
                if (!isOpen)
                    return;
                entries = entries.map((entry) => entry.id === id
                    ? { ...entry, options: { ...entry.options, ...options } }
                    : entry);
                publish();
            },
        };
        entries = [
            ...entries,
            {
                id,
                options: initial,
                handle: handle,
            },
        ];
        publish();
        return handle;
    }
    return {
        open,
        closeAll() {
            for (const entry of [...entries].reverse())
                entry.handle.close();
        },
        getSnapshot: () => entries,
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
/** Renders a controller's open modals, the most recently opened on top. Render it once. */
export function ModalHost({ controller }) {
    const entries = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
    // A modal hides everything outside itself when it mounts, so modals mounted in the same commit
    // would hide each other. Newly listed modals mount one commit at a time, oldest first.
    const [mounted, setMounted] = useState(0);
    const count = Math.min(mounted, entries.length);
    useLayoutEffect(() => {
        if (count < entries.length)
            setMounted(count + 1);
        else if (mounted !== count)
            setMounted(count);
    }, [count, mounted, entries.length]);
    return (_jsx(_Fragment, { children: entries.slice(0, count).map((entry) => (_jsx(ModalHostEntry, { entry: entry }, entry.id))) }));
}
//# sourceMappingURL=modal-controller.js.map