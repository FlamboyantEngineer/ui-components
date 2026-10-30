// The toast queue: a building-block queue for order and visibility, plus content that updates in
// place, lifetimes the toasts restart, promise toasts and exits that play before removal.

import type { ReactNode } from 'react';
import type { Tone } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';

export type ToastTone = Extract<Tone, 'info' | 'success' | 'warning' | 'danger'>;

/** An inline action. Pressing it runs `onAction`, then dismisses the toast. */
export interface ToastAction {
  label: string;
  onAction: () => void;
}

/** What a toast shows. */
export interface ToastContent {
  /** Defaults to `info`. `warning` and `danger` are announced assertively, the others politely. */
  tone?: ToastTone | undefined;
  title: ReactNode;
  description?: ReactNode;
  /** Replaces the tone's glyph: an imported icon component or rendered element. */
  icon?: IconSource;
  action?: ToastAction | undefined;
  /** Work is in progress: a busy indicator replaces the glyph and the toast has no timeout. */
  isPending?: boolean | undefined;
}

export interface ToastAddOptions {
  /** Called once the toast has closed, unless it was replaced or cleared. */
  onClose?: (() => void) | undefined;
  /**
   * Milliseconds before the toast closes itself; `0` keeps it until it is dismissed. Defaults to the
   * queue's `defaultTimeout`, or to `0` for a pending toast. Hovering or focusing the toasts pauses
   * every timer.
   */
  timeout?: number | undefined;
  /** A caller key: adding a toast with the key of one still queued replaces it. */
  id?: string | undefined;
}

export interface ToastUpdateOptions {
  /** A new lifetime in milliseconds, counted from the update; `0` keeps the toast until dismissed. */
  timeout?: number | undefined;
}

/** The contents of a promise toast: while it runs, once it resolves, and once it rejects. */
export interface ToastPromiseContents<T> {
  pending: ToastContent;
  /** Defaults to the `success` tone. */
  success: ToastContent | ((value: T) => ToastContent);
  /** Defaults to the `danger` tone. */
  error: ToastContent | ((error: unknown) => ToastContent);
}

export interface ToastQueueOptions {
  /** How many toasts show at once; the rest wait their turn. Defaults to no limit. */
  maxVisibleToasts?: number | undefined;
  /** Timeout for toasts added without one, in milliseconds. Defaults to 5000; `0` disables it. */
  defaultTimeout?: number | undefined;
}

/**
 * The toasts to show, newest first. The host creates one with `createToastQueue`, renders it in a
 * `ToastRegion` and calls `add` whenever something happened; `close` and `clear` remove toasts early.
 */
export interface ToastQueue {
  /** Adds a toast and returns its key. */
  add: (content: ToastContent, options?: ToastAddOptions) => string;
  /** Changes a queued toast in place, keeping its position and, unless told otherwise, its timer. */
  update: (key: string, content: ToastContent, options?: ToastUpdateOptions) => void;
  /** Adds a pending toast that turns into a success or error toast when `promise` settles. */
  promise: <T>(
    promise: Promise<T>,
    contents: ToastPromiseContents<T>,
    options?: ToastAddOptions,
  ) => string;
  /** Closes one toast, calling its `onClose` once its exit ends. */
  close: (key: string) => void;
  /** Removes every toast at once, without calling their `onClose`. */
  clear: () => void;
  /** The timeout of toasts added without one, in milliseconds. */
  readonly defaultTimeout: number;
}

/**
 * The building block's queue a library queue drives: it orders the toasts, shows the visible ones
 * and runs their timers, all of which close through `close`.
 */
interface ToastStore {
  add: (content: ToastContent, options: { timeout: number; onClose: () => void }) => string;
  close: (key: string) => void;
  clear: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
}

/** What a queued toast shows now, how long it lives and whether it is still open. */
export interface ToastSnapshot {
  content: ToastContent;
  /** The lifetime in milliseconds; `0` for none. */
  timeout: number;
  /** Counts lifetime restarts, so the toast restarts its timer even with the same timeout. */
  lifetime: number;
  /** False once the toast is closing and playing its exit. */
  isOpen: boolean;
}

/** How a rendered toast follows its queue entry. */
export interface ToastLifecycle {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ToastSnapshot;
  /** Counts the toast as rendered, so closing it waits for its exit; returns the release. */
  mount: () => () => void;
  /** Removes the toast from the queue once its exit has ended. */
  finishExit: () => void;
}

/** The longest timer a browser keeps; React Aria needs a timer on every toast the queue restarts. */
const timerlessTimeout = 2 ** 31 - 1;

const defaultToastTimeout = 5000;

/** Lifecycles by the content object the React Aria queue holds for each toast. */
const lifecycles = new WeakMap<object, ToastLifecycle>();

/** The lifecycle of a toast, which every toast gets as `createToastQueue` adds it. */
export function getToastLifecycle(content: ToastContent): ToastLifecycle {
  const lifecycle = lifecycles.get(content);
  if (!lifecycle) throw new Error('A toast must come from createToastQueue.');
  return lifecycle;
}

function resolveContent<T>(content: ToastContent | ((value: T) => ToastContent), value: T) {
  return typeof content === 'function' ? content(value) : content;
}

/** The lifetime an update starts: its own, none while pending, the default once done, else none. */
function resolveUpdateTimeout(
  previous: ToastContent,
  next: ToastContent,
  { options, defaultTimeout }: { options?: ToastUpdateOptions | undefined; defaultTimeout: number },
): number | undefined {
  if (options?.timeout !== undefined) return options.timeout;
  if (next.isPending && !previous.isPending) return 0;
  if (previous.isPending && !next.isPending) return defaultTimeout;
  return undefined;
}

interface ToastRecord {
  snapshot: ToastSnapshot;
  listeners: Set<() => void>;
  mounted: number;
}

function createRecord(content: ToastContent, timeout: number): ToastRecord {
  const snapshot = { content, timeout, lifetime: 0, isOpen: true };
  return { snapshot, listeners: new Set(), mounted: 0 };
}

function setSnapshot(record: ToastRecord, snapshot: ToastSnapshot) {
  record.snapshot = snapshot;
  for (const listener of record.listeners) listener();
}

function createLifecycle(record: ToastRecord, remove: () => void): ToastLifecycle {
  return {
    subscribe: (listener) => {
      record.listeners.add(listener);
      return () => record.listeners.delete(listener);
    },
    getSnapshot: () => record.snapshot,
    mount: () => {
      record.mounted += 1;
      return () => {
        record.mounted -= 1;
      };
    },
    finishExit: remove,
  };
}

/** Adds the pending toast of a promise and settles it in place when the promise does. */
function startPromiseToast<T>({
  queue,
  work,
  contents: { pending, success, error },
  options: { timeout, ...options } = {},
}: {
  queue: Pick<ToastQueue, 'add' | 'update'>;
  work: Promise<T>;
  contents: ToastPromiseContents<T>;
  options?: ToastAddOptions | undefined;
}): string {
  const key = queue.add({ ...pending, isPending: true }, { ...options, timeout: 0 });
  const settle = (content: ToastContent) =>
    queue.update(key, { ...content, isPending: false }, timeout === undefined ? {} : { timeout });
  work.then(
    (value) => settle({ tone: 'success', ...resolveContent(success, value) }),
    (reason: unknown) => settle({ tone: 'danger', ...resolveContent(error, reason) }),
  );
  return key;
}

/**
 * A toast queue over a building-block queue, adding a default timeout, replacement by `id`,
 * in-place updates, promise toasts and closing exits. Every close (its timer, its dismiss button,
 * its action or `close`) first lets a rendered toast play its exit, then removes it.
 */
export function createQueueOverStore(
  ariaQueue: ToastStore,
  { defaultTimeout = defaultToastTimeout }: ToastQueueOptions = {},
): ToastQueue {
  const removeNow = ariaQueue.close.bind(ariaQueue);
  const records = new Map<string, ToastRecord>();
  const keysById = new Map<string, string>();
  const replacedKeys = new Set<string>();

  // The building block's timers, dismiss buttons and state all close through the queue's `close`.
  ariaQueue.close = (key) => {
    const record = records.get(key);
    if (record && record.mounted > 0) {
      if (record.snapshot.isOpen) setSnapshot(record, { ...record.snapshot, isOpen: false });
      return;
    }
    removeNow(key);
  };
  // Each toast holds its own timer while its region is hovered or holds focus (useToastTimer). The
  // building block's region pauses and resumes every timer only as its hover and focus change, which
  // misses a timer started meanwhile, and resuming a running timer starts a second timeout, so its
  // calls do nothing.
  ariaQueue.pauseAll = () => {};
  ariaQueue.resumeAll = () => {};

  function add(content: ToastContent, { id, onClose, timeout }: ToastAddOptions = {}) {
    const lifetime = timeout ?? (content.isPending ? 0 : defaultTimeout);
    const previous = id === undefined ? undefined : keysById.get(id);
    if (previous !== undefined) {
      replacedKeys.add(previous);
      ariaQueue.close(previous);
    }
    const queued = { ...content };
    const key = ariaQueue.add(queued, {
      timeout: lifetime > 0 ? lifetime : timerlessTimeout,
      onClose: () => {
        records.delete(key);
        if (id !== undefined && keysById.get(id) === key) keysById.delete(id);
        if (!replacedKeys.delete(key)) onClose?.();
      },
    });
    const record = createRecord(content, lifetime);
    records.set(key, record);
    lifecycles.set(
      queued,
      createLifecycle(record, () => removeNow(key)),
    );
    if (id !== undefined) keysById.set(id, key);
    return key;
  }

  function update(key: string, content: ToastContent, options?: ToastUpdateOptions) {
    const record = records.get(key);
    if (!record?.snapshot.isOpen) return;
    const previous = record.snapshot;
    const timeout = resolveUpdateTimeout(previous.content, content, { options, defaultTimeout });
    const lifetime = timeout === undefined ? {} : { timeout, lifetime: previous.lifetime + 1 };
    setSnapshot(record, { ...previous, content, ...lifetime });
  }

  function clear() {
    keysById.clear();
    replacedKeys.clear();
    records.clear();
    ariaQueue.clear();
  }

  return {
    add,
    update,
    promise: (work, contents, options) =>
      startPromiseToast({ queue: { add, update }, work, contents, options }),
    close: (key) => ariaQueue.close(key),
    clear,
    defaultTimeout,
  };
}
