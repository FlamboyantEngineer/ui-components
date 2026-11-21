import type { ReactNode } from 'react';
import type { DialogProps } from './dialog.js';

/** One opening of a modal, returned by `DialogController.open`. */
export interface DialogHandle<T = unknown> {
  /** Unique within its controller. */
  readonly id: string;
  /** True until the modal closes. */
  readonly isOpen: boolean;
  /** Settles once, when the modal closes: with the value given to `close`, or `undefined` when dismissed. */
  readonly result: Promise<T | undefined>;
  /** Closes the modal. Later calls do nothing. */
  close(result?: T): void;
  /** Merges new options into the open modal. Does nothing once it has closed. */
  update(options: DialogUpdateOptions<T>): void;
}

/** Options for a modal drawn by `Dialog`: its props, with the body as `content`. */
export interface DialogContentOptions<T = unknown> extends Omit<
  DialogProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'children'
> {
  /** The body. A function receives the handle, to close the modal with a result or update it. */
  content?: ReactNode | ((handle: DialogHandle<T>) => ReactNode);
}

/** What `render` receives to draw a modal of its own (a `Dialog`, a host composition). */
export interface DialogEntryRenderProps<T = unknown> {
  /** Always true while the entry renders; pass it to the modal's `isOpen`. */
  isOpen: boolean;
  /** Pass to the modal's `onOpenChange`; closing it dismisses the entry. */
  onOpenChange: (isOpen: boolean) => void;
  /** Closes the entry with a result, like `handle.close`. */
  close: (result?: T) => void;
  /** The entry's handle. */
  handle: DialogHandle<T>;
}

/** Options for a modal the caller draws itself. */
export interface DialogRenderOptions<T = unknown> {
  /**
   * Draws the modal; it renders while the entry is open and leaves the page as soon as the entry
   * closes, since the host cannot tell when a modal of its own finishes its exit.
   */
  render: (props: DialogEntryRenderProps<T>) => ReactNode;
}

export type DialogOpenOptions<T = unknown> = DialogContentOptions<T> | DialogRenderOptions<T>;

export type DialogUpdateOptions<T = unknown> =
  Partial<DialogContentOptions<T>> | Partial<DialogRenderOptions<T>>;

/** An open modal as the controller lists it, in opening order. */
export interface DialogEntry {
  /** The handle's id. */
  readonly id: string;
  /** The options given to `open`, merged with every update. */
  readonly options: DialogOpenOptions<never>;
  /** The handle `open` returned. */
  readonly handle: DialogHandle<never>;
}

/** An imperative store of open modals. `DialogHost` renders them. */
export interface DialogController {
  /** Opens a modal above any already open, and returns its handle. */
  open<T = void>(options: DialogOpenOptions<T>): DialogHandle<T>;
  /** Dismisses every open modal, topmost first. */
  closeAll(): void;
  /** The open modals, oldest first. A new array whenever the list or an entry changes. */
  getSnapshot(): readonly DialogEntry[];
  /** Calls `listener` after every change; returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

/**
 * Creates a modal controller. The host creates one, renders `<DialogHost controller={…} />` once, and
 * passes the controller to whatever opens modals. Dialogs opened before the host mounts appear when it
 * does, in opening order.
 */
export function createDialogController(): DialogController {
  let entries: readonly DialogEntry[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of [...listeners]) listener();
  };

  function open<T>(initial: DialogOpenOptions<T>): DialogHandle<T> {
    nextId += 1;
    const id = `modal-${nextId}`;
    let isOpen = true;
    let settle!: (value: T | undefined) => void;
    const result = new Promise<T | undefined>((resolve) => {
      settle = resolve;
    });

    const handle: DialogHandle<T> = {
      id,
      get isOpen() {
        return isOpen;
      },
      result,
      close(value) {
        if (!isOpen) return;
        isOpen = false;
        entries = entries.filter((entry) => entry.id !== id);
        publish();
        settle(value);
      },
      update(options) {
        if (!isOpen) return;
        entries = entries.map((entry) =>
          entry.id === id
            ? { ...entry, options: { ...entry.options, ...options } as DialogOpenOptions<never> }
            : entry,
        );
        publish();
      },
    };

    entries = [
      ...entries,
      {
        id,
        options: initial as DialogOpenOptions<never>,
        handle: handle as DialogHandle<never>,
      },
    ];
    publish();
    return handle;
  }

  return {
    open,
    closeAll() {
      for (const entry of [...entries].reverse()) entry.handle.close();
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
