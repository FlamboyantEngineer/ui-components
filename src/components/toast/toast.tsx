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
  type ToastState,
} from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button, ButtonIcon } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

/** An inline action. Pressing it runs `onAction`, then dismisses the toast. */
export interface ToastAction {
  label: string;
  onAction: () => void;
}

/** What a toast shows. */
export interface ToastContent {
  /** Defaults to `info`. `warning` and `error` are announced assertively, the others politely. */
  tone?: ToastTone | undefined;
  title: ReactNode;
  description?: ReactNode;
  /** Replaces the tone's glyph: a built-in glyph name or any icon node. */
  icon?: GlyphName | ReactNode;
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
  /** Wraps each update, for example in `document.startViewTransition`. */
  wrapUpdate?: ((update: () => void, action: 'add' | 'remove' | 'clear') => void) | undefined;
}

/** The default lifetime of a toast, in milliseconds. */
export const TOAST_DEFAULT_TIMEOUT = 5000;

/**
 * The toasts to show, newest first. The host creates one queue, renders it in a `ToastRegion` and
 * calls `add` whenever something happened; `close` and `clear` remove toasts early.
 */
export class ToastQueue extends AriaToastQueue<ToastContent> {
  readonly defaultTimeout: number;
  private readonly keysById = new Map<string, string>();
  private readonly replacedKeys = new Set<string>();

  constructor({ defaultTimeout = TOAST_DEFAULT_TIMEOUT, ...options }: ToastQueueOptions = {}) {
    super({
      ...(options.maxVisibleToasts === undefined
        ? {}
        : { maxVisibleToasts: options.maxVisibleToasts }),
      ...(options.wrapUpdate ? { wrapUpdate: options.wrapUpdate } : {}),
    });
    this.defaultTimeout = defaultTimeout;
  }

  /** Adds a toast and returns its key. */
  override add(content: ToastContent, options: ToastAddOptions = {}): string {
    const { id, onClose, timeout = this.defaultTimeout } = options;
    const previous = id === undefined ? undefined : this.keysById.get(id);
    if (previous !== undefined) {
      this.replacedKeys.add(previous);
      this.close(previous);
    }
    let key = '';
    key = super.add(content, {
      ...(timeout > 0 ? { timeout } : {}),
      onClose: () => {
        if (id !== undefined && this.keysById.get(id) === key) this.keysById.delete(id);
        if (this.replacedKeys.delete(key)) return;
        onClose?.();
      },
    });
    if (id !== undefined) this.keysById.set(id, key);
    return key;
  }

  /** Removes every toast without calling their `onClose`. */
  override clear(): void {
    this.keysById.clear();
    this.replacedKeys.clear();
    super.clear();
  }
}

export interface ToastProps {
  toast: QueuedToast<ToastContent>;
  className?: string | undefined;
}

export interface ToastRegionProps {
  queue: ToastQueue;
  /** Names the landmark. Defaults to React Aria's localised count of notifications. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

export interface ToastListProps {
  queue: ToastQueue;
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
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

const TONE_GLYPHS: Readonly<Record<ToastTone, GlyphName>> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

function isAssertive(tone: ToastTone): boolean {
  return tone === 'warning' || tone === 'error';
}

/**
 * One toast: tone glyph, title, optional description, optional action and a dismiss button. It
 * renders inside a `ToastRegion` or `ToastList`, which supply its queue.
 */
export function Toast({ toast, className }: ToastProps) {
  const strings = useUiStrings();
  const state = useContext(ToastStateContext);
  const { tone = 'info', title, description, icon, action } = toast.content;
  const hasDescription = description != null && description !== false && description !== '';
  return (
    <AriaToast toast={toast} {...toastHooks.root({ className, data: { tone } })}>
      <ButtonIcon icon={icon ?? TONE_GLYPHS[tone]} className={toastHooks.slotClass('icon')} />
      <AriaToastContent
        {...toastHooks.slot('content')}
        role={isAssertive(tone) ? 'alert' : 'status'}
      >
        <Text slot="title" className={toastHooks.slotClass('title')}>
          {title}
        </Text>
        {hasDescription ? (
          <Text slot="description" className={toastHooks.slotClass('description')}>
            {description}
          </Text>
        ) : null}
      </AriaToastContent>
      {action ? (
        <Button
          variant="tertiary"
          size="sm"
          className={toastHooks.slotClass('action')}
          onPress={() => {
            action.onAction();
            state?.close(toast.key);
          }}
        >
          {action.label}
        </Button>
      ) : null}
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

function renderToast({ toast }: { toast: QueuedToast<ToastContent> }) {
  return <Toast toast={toast} />;
}

/**
 * The live region for a queue: a landmark (reachable with F6) portalled into the document body
 * while it has toasts, pausing every timer while it is hovered or holds focus.
 */
export function ToastRegion({ queue, className, ...rest }: ToastRegionProps) {
  return (
    <AriaToastRegion queue={queue} {...rest} {...regionHooks.root({ className, props: rest })}>
      <AriaToastList className={listHooks.className}>{renderToast}</AriaToastList>
    </AriaToastRegion>
  );
}

/**
 * Draws a queue's toasts where it is rendered, without the region's portal, landmark and pausing:
 * for previews and pages that place a static stack themselves.
 */
export function ToastList({ queue, className, ...rest }: ToastListProps) {
  const visibleToasts = useSyncExternalStore(
    (onChange) => queue.subscribe(onChange),
    () => queue.visibleToasts,
    () => queue.visibleToasts,
  );
  const state = useMemo<ToastState<ToastContent>>(
    () => ({
      visibleToasts,
      add: (content, options) => queue.add(content, options),
      close: (key) => queue.close(key),
      pauseAll: () => queue.pauseAll(),
      resumeAll: () => queue.resumeAll(),
    }),
    [queue, visibleToasts],
  );
  const data = pickDataAttributes(rest);
  return (
    <ToastStateContext.Provider value={state}>
      <AriaToastList
        className={listHooks.root({ className }).className}
        render={(props) => <ol {...props} {...data} />}
      >
        {renderToast}
      </AriaToastList>
    </ToastStateContext.Provider>
  );
}
