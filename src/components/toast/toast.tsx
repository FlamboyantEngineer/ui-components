import { useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import {
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastList as AriaToastList,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
  UNSTABLE_ToastStateContext as ToastStateContext,
  type QueuedToast,
  type ToastOptions as AriaToastOptions,
  type ToastRegionProps as AriaToastRegionProps,
  type ToastState,
} from 'react-aria-components';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import type { BaseProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { getToneGlyph } from '../banner/banner.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { Icon, toIconProps, type IconSource } from '../icon/icon.js';

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
  /** Replaces the tone's glyph: a built-in glyph name or any icon node. */
  icon?: IconSource;
  action?: ToastAction | undefined;
}

export interface ToastAddOptions extends AriaToastOptions {
  /**
   * Milliseconds before the toast closes itself; `0` keeps it until it is dismissed. Defaults to the
   * queue's `defaultTimeout`. Hovering or focusing the toasts pauses every timer.
   */
  timeout?: number;
  /** A caller key: adding a toast with the key of one still queued replaces it. */
  id?: string | undefined;
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
  /** Removes one toast, calling its `onClose`. */
  close: (key: string) => void;
  /** Removes every toast without calling their `onClose`. */
  clear: () => void;
  /** The timeout of toasts added without one, in milliseconds. */
  readonly defaultTimeout: number;
  /** The React Aria queue that holds the visible toasts; regions and lists render it. */
  readonly ariaQueue: AriaToastQueue<ToastContent>;
}

export interface ToastProps extends BaseProps {
  /** The queued toast to draw. */
  toast: QueuedToast<ToastContent>;
}

export interface ToastRegionProps
  extends
    Omit<
      AriaToastRegionProps<ToastContent>,
      'queue' | 'children' | 'className' | 'style' | 'render'
    >,
    BaseProps {
  /** The queue whose toasts the region shows. */
  queue: ToastQueue;
}

export interface ToastListProps extends BaseProps {
  /** The queue whose toasts the list draws. */
  queue: ToastQueue;
}

const toastHooks = createHooks('toast', [
  'icon',
  'content',
  'title',
  'description',
  'action',
  'close',
]);
const regionHooks = createHooks('toast-region');
const listHooks = createHooks('toast-list');

const defaultToastTimeout = 5000;

function isAssertive(tone: ToastTone): boolean {
  return tone === 'warning' || tone === 'danger';
}

function renderToast({ toast }: { toast: QueuedToast<ToastContent> }) {
  return <Toast toast={toast} />;
}

/** The toast's live region: its title and, when set, its description. */
function ToastText({
  tone,
  title,
  description,
}: Pick<ToastContent, 'title' | 'description'> & { tone: ToastTone }) {
  return (
    <AriaToastContent {...toastHooks.slot('content')} role={isAssertive(tone) ? 'alert' : 'status'}>
      <Text slot="title" className={toastHooks.slotClass('title')}>
        {title}
      </Text>
      {isEmptyNode(description) ? null : (
        <Text slot="description" className={toastHooks.slotClass('description')}>
          {description}
        </Text>
      )}
    </AriaToastContent>
  );
}

/** The action button: runs the action, then closes the toast through its region's state. */
function ToastActionButton({ action, toastKey }: { action: ToastAction; toastKey: string }) {
  const state = useContext(ToastStateContext);
  return (
    <Button
      variant="tertiary"
      size="sm"
      className={toastHooks.slotClass('action')}
      onPress={() => {
        action.onAction();
        state?.close(toastKey);
      }}
    >
      {action.label}
    </Button>
  );
}

/**
 * Creates a toast queue over React Aria's queue, adding a default timeout and replacement by `id`:
 * a toast added with the `id` of one still queued replaces it without calling its `onClose`.
 */
export function createToastQueue({
  maxVisibleToasts,
  defaultTimeout = defaultToastTimeout,
}: ToastQueueOptions = {}): ToastQueue {
  const ariaQueue = new AriaToastQueue<ToastContent>({ maxVisibleToasts });
  const keysById = new Map<string, string>();
  const replacedKeys = new Set<string>();

  function add(
    content: ToastContent,
    { id, onClose, timeout = defaultTimeout }: ToastAddOptions = {},
  ) {
    const previous = id === undefined ? undefined : keysById.get(id);
    if (previous !== undefined) {
      replacedKeys.add(previous);
      ariaQueue.close(previous);
    }
    const key = ariaQueue.add(content, {
      timeout: timeout > 0 ? timeout : undefined,
      onClose: () => {
        if (id !== undefined && keysById.get(id) === key) keysById.delete(id);
        if (!replacedKeys.delete(key)) onClose?.();
      },
    });
    if (id !== undefined) keysById.set(id, key);
    return key;
  }

  function clear() {
    keysById.clear();
    replacedKeys.clear();
    ariaQueue.clear();
  }

  return { add, close: (key) => ariaQueue.close(key), clear, defaultTimeout, ariaQueue };
}

/**
 * One toast: tone glyph, title, optional description, optional action and a dismiss button. It
 * renders inside a `ToastRegion` or `ToastList`, which supply its queue.
 */
export function Toast({ toast, className, ...rest }: ToastProps) {
  const strings = useUiStrings();
  const { tone = 'info', title, description, icon, action } = toast.content;
  return (
    <AriaToast {...rest} toast={toast} {...toastHooks.root({ className, data: { tone } })}>
      <Icon {...toIconProps(icon ?? getToneGlyph(tone))} className={toastHooks.slotClass('icon')} />
      <ToastText tone={tone} title={title} description={description} />
      {action ? <ToastActionButton action={action} toastKey={toast.key} /> : null}
      <IconButton
        slot="close"
        icon="close"
        label={strings.dismiss}
        size="sm"
        className={toastHooks.slotClass('close')}
      />
    </AriaToast>
  );
}

/**
 * The live region for a queue: a landmark (reachable with F6) portalled into the document body
 * while it has toasts, pausing every timer while it is hovered or holds focus.
 */
export function ToastRegion({ queue, className, ...rest }: ToastRegionProps) {
  return (
    <AriaToastRegion {...rest} queue={queue.ariaQueue} {...regionHooks.root({ className })}>
      <AriaToastList className={listHooks.className}>{renderToast}</AriaToastList>
    </AriaToastRegion>
  );
}

/**
 * Draws a queue's toasts where it is rendered, without the region's portal, landmark and pausing:
 * for previews and pages that place a static stack themselves.
 */
export function ToastList({ queue: { ariaQueue }, className, ...rest }: ToastListProps) {
  const visibleToasts = useSyncExternalStore(
    (onChange) => ariaQueue.subscribe(onChange),
    () => ariaQueue.visibleToasts,
    () => ariaQueue.visibleToasts,
  );
  const state = useMemo<ToastState<ToastContent>>(
    () => ({
      visibleToasts,
      add: (content, options) => ariaQueue.add(content, options),
      close: (key) => ariaQueue.close(key),
      pauseAll: () => ariaQueue.pauseAll(),
      resumeAll: () => ariaQueue.resumeAll(),
    }),
    [ariaQueue, visibleToasts],
  );
  // React Aria's list forwards no DOM props, so the caller's id and data attributes go through render.
  const attributes = { ...pickDataAttributes(rest), id: rest.id };
  return (
    <ToastStateContext.Provider value={state}>
      <AriaToastList
        className={listHooks.root({ className }).className}
        render={(props) => <ol {...props} {...attributes} />}
      >
        {renderToast}
      </AriaToastList>
    </ToastStateContext.Provider>
  );
}
