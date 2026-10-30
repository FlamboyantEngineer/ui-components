import { CloseGlyph } from '../../core/glyphs.js';
import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastList as AriaToastList,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
  UNSTABLE_ToastStateContext as ToastStateContext,
  UNSAFE_PortalProvider as AriaPortalProvider,
  type QueuedToast,
  type ToastState,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, measuredProperty, pickDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { getToneGlyph } from '../banner/banner.js';
import { Button } from '../button/button.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { useLayerZIndex, usePortalContainer } from '../portal/portal.js';
import {
  createQueueOverStore,
  getToastLifecycle,
  type ToastAction,
  type ToastContent,
  type ToastQueue,
  type ToastQueueOptions,
  type ToastTone,
} from './toast-queue.js';
import {
  ToastStackProvider,
  useIsStackPaused,
  useStackExpanded,
  useToastStack,
  useToastStackPosition,
  type ToastStackSettings,
} from './toast-stack.js';
import { useToastPresence, useToastSnapshot, useToastTimer } from './use-toast-lifecycle.js';
import { useToastSwipe } from './use-toast-swipe.js';

export type {
  ToastAction,
  ToastAddOptions,
  ToastContent,
  ToastPromiseContents,
  ToastQueue,
  ToastQueueOptions,
  ToastTone,
  ToastUpdateOptions,
} from './toast-queue.js';
export type { ToastStackSettings } from './toast-stack.js';
export type { ToastSwipeDirection } from './use-toast-swipe.js';

export interface ToastRegionProps extends ToastStackSettings, AriaLabellingProps, BaseProps {
  /** The queue whose toasts the region shows. */
  queue: ToastQueue;
}

export interface ToastListProps extends ToastStackSettings, BaseProps {
  /** The queue whose toasts the list draws. */
  queue: ToastQueue;
}

const toastHooks = createHooks('toast', [
  'icon',
  'spinner',
  'content',
  'title',
  'description',
  'action',
  'close',
]);
const regionHooks = createHooks('toast-region');
const listHooks = createHooks('toast-list');

function isAssertive(tone: ToastTone): boolean {
  return tone === 'warning' || tone === 'danger';
}

/** The building block's queue behind each library queue. */
const ariaQueues = new WeakMap<ToastQueue, AriaToastQueue<ToastContent>>();

function getAriaQueue(queue: ToastQueue): AriaToastQueue<ToastContent> {
  const ariaQueue = ariaQueues.get(queue);
  if (!ariaQueue) throw new Error('A toast queue must come from createToastQueue.');
  return ariaQueue;
}

/** The building block queue's visible toasts, following its changes. */
function useVisibleToasts(ariaQueue: AriaToastQueue<ToastContent>) {
  const subscribe = useCallback(
    (onChange: () => void) => ariaQueue.subscribe(onChange),
    [ariaQueue],
  );
  const getSnapshot = () => ariaQueue.visibleToasts;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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
 * One toast: tone glyph (or a busy indicator while pending), title, optional description, optional
 * action and a dismiss button. It renders inside a `ToastRegion` or `ToastList`, which supply its
 * queue; it follows in-place updates, plays its enter and exit, and can be swiped away.
 */
function Toast({ toast }: { toast: QueuedToast<ToastContent> }) {
  const strings = useUiStrings();
  const state = useContext(ToastStateContext);
  const lifecycle = getToastLifecycle(toast.content);
  const snapshot = useToastSnapshot(lifecycle);
  const ref = useRef<HTMLDivElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(ref, snapshot.isOpen);
  const isPaused = useIsStackPaused();
  useToastTimer(toast.timer, snapshot, isPaused);
  useToastPresence(lifecycle, isMounted);
  const { index, offset, swipeDirection, swipeThreshold } = useToastStackPosition(toast.key, ref);
  const swipe = useToastSwipe({
    direction: swipeDirection,
    threshold: swipeThreshold,
    onDismiss: () => state?.close(toast.key),
  });
  if (!isMounted) return null;

  const { tone = 'info', title, description, icon, action, isPending = false } = snapshot.content;
  const data = {
    tone,
    pending: isPending,
    entering: isEntering,
    exiting: isExiting,
    swiping: swipe.isSwiping,
    swipeDirection,
  };
  const style = {
    ...measuredProperty('toast-index', String(index)),
    ...measuredProperty('toast-offset', offset),
    ...swipe.style,
  };
  return (
    <AriaToast
      {...swipe.swipeProps}
      ref={ref}
      // The queue's entry drives the timer (useToastTimer), so React Aria does not reset it.
      toast={{ ...toast, timeout: undefined }}
      style={style}
      {...toastHooks.root({ data })}
    >
      {isPending ? (
        <span {...toastHooks.slot('spinner')} aria-hidden="true" />
      ) : (
        <Icon
          {...toIconProps(icon ?? getToneGlyph(tone))}
          className={toastHooks.slotClass('icon')}
        />
      )}
      <ToastText tone={tone} title={title} description={description} />
      {action ? <ToastActionButton action={action} toastKey={toast.key} /> : null}
      <Button
        slot="close"
        icon={CloseGlyph}
        label={strings.dismiss}
        size="sm"
        className={toastHooks.slotClass('close')}
      />
    </AriaToast>
  );
}

/**
 * Points the building block's own portal at the library's overlay container, so the region renders
 * where every `Portal` below the nearest provider renders: the document body unless a provider or
 * host chooses another, and nothing while the chosen one is not ready.
 */
function ToastPortalContainer({ children }: { children: ReactNode }) {
  const container = usePortalContainer();
  if (container === undefined) return children;
  const target = container instanceof HTMLElement ? container : null;
  return <AriaPortalProvider getContainer={() => target}>{children}</AriaPortalProvider>;
}

/**
 * The live region for a queue: a landmark (reachable with F6) portalled into the overlay container
 * on the `toast` layer while it has toasts, pausing every timer and publishing `data-expanded` while
 * it is hovered or holds focus.
 */
export function ToastRegion({
  queue,
  swipeDirection,
  swipeThreshold,
  className,
  ...rest
}: ToastRegionProps) {
  const ariaQueue = getAriaQueue(queue);
  const hasToasts = useVisibleToasts(ariaQueue).length > 0;
  const { isExpanded, regionProps } = useStackExpanded(hasToasts);
  const stack = useToastStack({ swipeDirection, swipeThreshold }, isExpanded);
  const zIndex = useLayerZIndex('toast');
  return (
    <ToastStackProvider value={stack}>
      <ToastPortalContainer>
        <AriaToastRegion
          {...rest}
          queue={ariaQueue}
          {...regionHooks.root({ className, data: { expanded: isExpanded } })}
          style={{ zIndex }}
          // React Aria's region forwards no focus handlers, so they join its props here.
          render={(props) => <div {...mergeProps(props, regionProps)} />}
        >
          <AriaToastList className={listHooks.className}>{renderToast}</AriaToastList>
        </AriaToastRegion>
      </ToastPortalContainer>
    </ToastStackProvider>
  );
}

/**
 * Draws a queue's toasts where it is rendered, without the region's portal, landmark and pausing:
 * for previews and pages that place a static stack themselves.
 */
export function ToastList({
  queue,
  swipeDirection,
  swipeThreshold,
  className,
  ...rest
}: ToastListProps) {
  const ariaQueue = getAriaQueue(queue);
  const stack = useToastStack({ swipeDirection, swipeThreshold });
  const visibleToasts = useVisibleToasts(ariaQueue);
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
    <ToastStackProvider value={stack}>
      <ToastStateContext.Provider value={state}>
        <AriaToastList
          className={listHooks.root({ className }).className}
          render={(props) => <ol {...props} {...attributes} />}
        >
          {renderToast}
        </AriaToastList>
      </ToastStateContext.Provider>
    </ToastStackProvider>
  );
}

/**
 * Creates a toast queue: the host renders it in a `ToastRegion` (or a `ToastList`) and adds toasts
 * to it from anywhere.
 */
export function createToastQueue(options: ToastQueueOptions = {}): ToastQueue {
  const ariaQueue = new AriaToastQueue<ToastContent>({
    maxVisibleToasts: options.maxVisibleToasts,
  });
  const queue = createQueueOverStore(ariaQueue, options);
  ariaQueues.set(queue, ariaQueue);
  return queue;
}
