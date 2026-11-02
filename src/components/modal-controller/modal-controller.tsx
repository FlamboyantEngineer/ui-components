'use client';

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
  /**
   * Draws the modal; it renders while the entry is open and leaves the page as soon as the entry
   * closes, since the host cannot tell when a modal of its own finishes its exit.
   */
  render: (props: ModalEntryRenderProps<T>) => ReactNode;
}

export type ModalOpenOptions<T = unknown> = ModalContentOptions<T> | ModalRenderOptions<T>;

export type ModalUpdateOptions<T = unknown> =
  | Partial<ModalContentOptions<T>>
  | Partial<ModalRenderOptions<T>>;

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

interface ModalHostEntryProps {
  entry: ModalEntry;
  /** False while a closed modal runs its exit, before it leaves the host. */
  isOpen: boolean;
  /** Called once a closed modal's exit has ended. */
  onExitComplete: (() => void) | undefined;
}

function ModalHostEntry({ entry, isOpen, onExitComplete }: ModalHostEntryProps) {
  const handle = entry.handle as ModalHandle<unknown>;
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handle.close();
    },
    [handle],
  );
  const options = entry.options as ModalOpenOptions<unknown>;
  if ('render' in options) {
    return options.render({ isOpen: true, onOpenChange, close: handle.close, handle });
  }
  const { content, ...modalProps } = options;
  return (
    <Modal
      {...modalProps}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onExitComplete={isOpen ? undefined : onExitComplete}
    >
      {typeof content === 'function' ? content(handle) : content}
    </Modal>
  );
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

/** A key per controller, so a host given another controller starts its modals afresh. */
const controllerKeys = new WeakMap<ModalController, number>();
let lastControllerKey = 0;

function keyOf(controller: ModalController): number {
  let key = controllerKeys.get(controller);
  if (key === undefined) {
    lastControllerKey += 1;
    key = lastControllerKey;
    controllerKeys.set(controller, key);
  }
  return key;
}

/** Where a modal stands in its controller's opening order; IDs count up as modals open. */
function openingOrder(entry: ModalEntry): number {
  return Number(entry.id.slice(entry.id.lastIndexOf('-') + 1));
}

/**
 * The modals that closed while shown and still run their exit, kept until it ends. A modal drawn by
 * `render` leaves at once, since the host cannot tell when its own exit ends.
 */
function useLeavingModals(shown: readonly ModalEntry[]) {
  const [last, setLast] = useState(shown);
  const [leaving, setLeaving] = useState<readonly ModalEntry[]>([]);
  const isSame =
    last.length === shown.length && last.every((entry, index) => entry === shown[index]);
  if (!isSame) {
    // Adjusting state while rendering keeps a closed modal on the page in the same commit.
    const ids = new Set(shown.map((entry) => entry.id));
    const gone = last.filter((entry) => !ids.has(entry.id) && !('render' in entry.options));
    setLast(shown);
    if (gone.length > 0) setLeaving((current) => [...current, ...gone]);
  }
  const finish = useCallback((entry: ModalEntry) => {
    setLeaving((current) => current.filter((item) => item !== entry));
    (entry.options as ModalContentOptions).onExitComplete?.();
  }, []);
  return { leaving, finish };
}

/** One controller's open modals, the most recently opened on top. */
function ControllerModals({ controller }: ModalHostProps) {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Each modal must be committed, and hide the rest, before the next one mounts.
    if (count < entries.length) setMounted(count + 1);
    else if (mounted !== count) setMounted(count);
  }, [count, mounted, entries.length]);
  const shown = entries.slice(0, count);
  const { leaving, finish } = useLeavingModals(shown);
  const listed = [
    ...shown.map((entry) => ({ entry, isOpen: true })),
    ...leaving.map((entry) => ({ entry, isOpen: false })),
  ].sort((a, b) => openingOrder(a.entry) - openingOrder(b.entry));
  return (
    <>
      {listed.map(({ entry, isOpen }) => (
        <ModalHostEntry
          key={entry.id}
          entry={entry}
          isOpen={isOpen}
          onExitComplete={() => finish(entry)}
        />
      ))}
    </>
  );
}

/**
 * Renders a controller's open modals, the most recently opened on top. Render it once. Given another
 * controller, it drops the modals it showed and shows the new controller's from scratch: modal IDs
 * are unique within one controller only, so no draft, pending state or focus carries across.
 */
export function ModalHost({ controller }: ModalHostProps) {
  return <ControllerModals key={keyOf(controller)} controller={controller} />;
}
