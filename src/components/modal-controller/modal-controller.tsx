import {
  useCallback,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Modal, type ModalProps } from '../modal/modal.js';

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
export interface ModalContentOptions<T = unknown> extends Omit<
  ModalProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'children'
> {
  /** The body. A function receives the handle, to close the modal with a result or update it. */
  content?: ReactNode | ((handle: ModalHandle<T>) => ReactNode);
}

/** What `render` receives to draw a modal of its own (a `ConfirmDialog`, a host composition). */
export interface ModalEntryRenderProps<T = unknown> {
  /** Always true while the entry renders; pass it to the modal's `isOpen`. */
  isOpen: boolean;
  /** Pass to the modal's `onOpenChange`; closing it dismisses the entry. */
  onOpenChange: (isOpen: boolean) => void;
  close: (result?: T) => void;
  handle: ModalHandle<T>;
}

/** Options for a modal the caller draws itself. */
export interface ModalRenderOptions<T = unknown> {
  render: (props: ModalEntryRenderProps<T>) => ReactNode;
}

export type ModalOpenOptions<T = unknown> = ModalContentOptions<T> | ModalRenderOptions<T>;

export type ModalUpdateOptions<T = unknown> =
  | Partial<ModalContentOptions<T>>
  | Partial<ModalRenderOptions<T>>;

/** An open modal as the controller lists it, in opening order. */
export interface ModalEntry {
  readonly id: string;
  readonly options: ModalOpenOptions<never>;
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

/**
 * Creates a modal controller. The host creates one, renders `<ModalHost controller={…} />` once, and
 * passes the controller to whatever opens modals. Modals opened before the host mounts appear when it
 * does, in opening order.
 */
export function createModalController(): ModalController {
  let entries: readonly ModalEntry[] = [];
  let nextId = 0;
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of [...listeners]) listener();
  };

  function open<T>(initial: ModalOpenOptions<T>): ModalHandle<T> {
    nextId += 1;
    const id = `modal-${nextId}`;
    let isOpen = true;
    let settle!: (value: T | undefined) => void;
    const result = new Promise<T | undefined>((resolve) => {
      settle = resolve;
    });

    const handle: ModalHandle<T> = {
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
            ? { ...entry, options: { ...entry.options, ...options } as ModalOpenOptions<never> }
            : entry,
        );
        publish();
      },
    };

    entries = [
      ...entries,
      {
        id,
        options: initial as ModalOpenOptions<never>,
        handle: handle as ModalHandle<never>,
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

function ModalHostEntry({ entry }: { entry: ModalEntry }) {
  const handle = entry.handle as ModalHandle<unknown>;
  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) handle.close();
    },
    [handle],
  );
  const options = entry.options as ModalOpenOptions<unknown>;
  if ('render' in options) {
    return options.render({ isOpen: true, onOpenChange, close: handle.close, handle });
  }
  const { content, ...modalProps } = options;
  return (
    <Modal {...modalProps} isOpen onOpenChange={onOpenChange}>
      {typeof content === 'function' ? content(handle) : content}
    </Modal>
  );
}

export interface ModalHostProps {
  controller: ModalController;
}

/** Renders a controller's open modals, the most recently opened on top. Render it once. */
export function ModalHost({ controller }: ModalHostProps) {
  const entries = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  // A modal hides everything outside itself when it mounts, so modals mounted in the same commit
  // would hide each other. Newly listed modals mount one commit at a time, oldest first.
  const [mounted, setMounted] = useState(0);
  const count = Math.min(mounted, entries.length);
  useLayoutEffect(() => {
    if (count < entries.length) setMounted(count + 1);
    else if (mounted !== count) setMounted(count);
  }, [count, mounted, entries.length]);
  return (
    <>
      {entries.slice(0, count).map((entry) => (
        <ModalHostEntry key={entry.id} entry={entry} />
      ))}
    </>
  );
}
