import { type ReactNode } from 'react';
import { type ModalProps } from '../modal/modal.js';
/** One opening of a modal, returned by `ModalController.open`. */
export interface ModalHandle<T = unknown> {
    /** Unique within its controller. */
    readonly id: string;
    /** True until the modal closes. */
    readonly isOpen: boolean;
    /** Settles once, when the modal closes: with the value given to `close`, or `undefined` when dismissed. */
    readonly result: Promise<T | undefined>;
    /** Closes the modal. Later calls do nothing. */
    close(result?: T): void;
    /** Merges new options into the open modal. Does nothing once it has closed. */
    update(options: ModalUpdateOptions<T>): void;
}
/** Options for a modal drawn by `Modal`: its props, with the body as `content`. */
export interface ModalContentOptions<T = unknown> extends Omit<ModalProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'children'> {
    /** The body. A function receives the handle, to close the modal with a result or update it. */
    content?: ReactNode | ((handle: ModalHandle<T>) => ReactNode);
}
/** What `render` receives to draw a modal of its own (a `Modal`, a host composition). */
export interface ModalEntryRenderProps<T = unknown> {
    /** Always true while the entry renders; pass it to the modal's `isOpen`. */
    isOpen: boolean;
    /** Pass to the modal's `onOpenChange`; closing it dismisses the entry. */
    onOpenChange: (isOpen: boolean) => void;
    /** Closes the entry with a result, like `handle.close`. */
    close: (result?: T) => void;
    /** The entry's handle. */
    handle: ModalHandle<T>;
}
/** Options for a modal the caller draws itself. */
export interface ModalRenderOptions<T = unknown> {
    /** Draws the modal; it renders while the entry is open. */
    render: (props: ModalEntryRenderProps<T>) => ReactNode;
}
export type ModalOpenOptions<T = unknown> = ModalContentOptions<T> | ModalRenderOptions<T>;
export type ModalUpdateOptions<T = unknown> = Partial<ModalContentOptions<T>> | Partial<ModalRenderOptions<T>>;
/** An open modal as the controller lists it, in opening order. */
export interface ModalEntry {
    /** The handle's id. */
    readonly id: string;
    /** The options given to `open`, merged with every update. */
    readonly options: ModalOpenOptions<never>;
    /** The handle `open` returned. */
    readonly handle: ModalHandle<never>;
}
/** An imperative store of open modals. `ModalHost` renders them. */
export interface ModalController {
    /** Opens a modal above any already open, and returns its handle. */
    open<T = void>(options: ModalOpenOptions<T>): ModalHandle<T>;
    /** Dismisses every open modal, topmost first. */
    closeAll(): void;
    /** The open modals, oldest first. A new array whenever the list or an entry changes. */
    getSnapshot(): readonly ModalEntry[];
    /** Calls `listener` after every change; returns the unsubscribe function. */
    subscribe(listener: () => void): () => void;
}
export interface ModalHostProps {
    /** The controller whose open modals the host renders. */
    controller: ModalController;
}
/**
 * Creates a modal controller. The host creates one, renders `<ModalHost controller={…} />` once, and
 * passes the controller to whatever opens modals. Modals opened before the host mounts appear when it
 * does, in opening order.
 */
export declare function createModalController(): ModalController;
/** Renders a controller's open modals, the most recently opened on top. Render it once. */
export declare function ModalHost({ controller }: ModalHostProps): import("react").JSX.Element;
//# sourceMappingURL=modal-controller.d.ts.map