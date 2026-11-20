'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { Announcer, useAnnounce } from '../announcer/announcer.js';
import { Button, type ButtonProps } from '../button/button.js';
import { scrollerHooks as hooks } from './scroller-hooks.js';
import {
  createScrollerRuntime,
  type MessageScrollerButtonDirection,
  type MessageScrollerDefaultScrollPosition,
} from './scroller-runtime.js';

export interface MessageScrollerProviderProps {
  children?: ReactNode;
  /** Follow at the end, including after an anchor's reserve fills. Defaults to `false`. */
  autoScroll?: boolean | undefined;
  /** Where an existing conversation opens. Defaults to `end`. */
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition | undefined;
}

export interface MessageScrollerProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageScrollerViewportProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageScrollerContentProps extends ContainerProps<'div'>, BaseProps {}

export interface MessageScrollerItemProps extends ContainerProps<'div'>, BaseProps {
  /** Stable identifier for this message within the scroller. Rows without one are decorative. */
  messageId?: string | undefined;
  /** Align this message to the top when appended or newly marked. */
  scrollAnchor?: boolean | undefined;
  /** Announces this message on completion and defaults its `aria-busy` state while streaming. */
  isStreaming?: boolean | undefined;
}

export interface MessageScrollerButtonProps extends Omit<ButtonProps, 'href'> {
  /** Which edge to bring into view. Defaults to `end`. */
  direction?: MessageScrollerButtonDirection | undefined;
}

const ScrollerContext = createContext<ReturnType<typeof createScrollerRuntime> | null>(null);

function useScrollerRuntime() {
  const runtime = useContext(ScrollerContext);
  if (!runtime) throw new Error('MessageScroller parts require a MessageScrollerProvider.');
  return runtime;
}

/** Owns scroll and live announcement state for one scroller. Key it when switching conversations. */
export function MessageScrollerProvider({
  children,
  autoScroll = false,
  defaultScrollPosition = 'end',
}: MessageScrollerProviderProps) {
  const [runtime] = useState(() => createScrollerRuntime({ autoScroll, defaultScrollPosition }));
  useLayoutEffect(() => {
    runtime.updateOptions({ autoScroll, defaultScrollPosition });
  }, [autoScroll, defaultScrollPosition, runtime]);

  return (
    <ScrollerContext value={runtime}>
      <Announcer>
        <ScrollerAnnouncements />
        {children}
      </Announcer>
    </ScrollerContext>
  );
}

function ScrollerAnnouncements() {
  const runtime = useScrollerRuntime();
  const strings = useUiStrings();
  const announce = useAnnounce();
  useLayoutEffect(
    () => runtime.subscribeAnnouncements((count) => announce(strings.newMessageCount(count))),
    [announce, runtime, strings],
  );
  return null;
}

/** Frames the viewport and its controls. */
export function MessageScroller({ className, ...props }: MessageScrollerProps) {
  return <div {...props} {...hooks.root({ className })} />;
}

/** The named, keyboard-scrollable region. */
export function MessageScrollerViewport({
  className,
  ref,
  onScroll,
  tabIndex = 0,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: MessageScrollerViewportProps) {
  const runtime = useScrollerRuntime();
  const strings = useUiStrings();
  const [viewportRef, setViewport] = useForwardedRef(ref);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    return viewport ? runtime.attach(viewport) : undefined;
  }, [runtime, viewportRef]);

  return (
    <div
      {...props}
      {...hooks.slot('viewport', undefined, className)}
      aria-label={labelledBy ? undefined : (label ?? strings.conversation)}
      aria-labelledby={labelledBy}
      role="region"
      ref={setViewport}
      tabIndex={tabIndex}
      onScroll={(event) => {
        runtime.scrolled();
        onScroll?.(event);
      }}
    />
  );
}

/** The message log. The provider announces completed arrivals without reading history or tokens. */
export function MessageScrollerContent({
  children,
  className,
  ...props
}: MessageScrollerContentProps) {
  return (
    <div
      {...props}
      {...hooks.slot('content', undefined, className)}
      role="log"
      aria-live="off"
      aria-relevant="additions"
    >
      {children}
      <div {...hooks.slot('spacer')} aria-hidden="true" />
    </div>
  );
}

/** One direct child of the log, identified independently from its React key and DOM id. */
export function MessageScrollerItem({
  className,
  messageId,
  scrollAnchor = false,
  isStreaming = false,
  'aria-busy': busy,
  ...props
}: MessageScrollerItemProps) {
  const data = {
    messageId,
    scrollAnchor: messageId !== undefined && scrollAnchor,
    streaming: isStreaming,
  };
  return (
    <div
      {...props}
      {...hooks.slot('item', data, className)}
      aria-busy={busy ?? (isStreaming || undefined)}
    />
  );
}

/** A jump control, available when content is hidden at its edge. */
export function MessageScrollerButton({
  children,
  className,
  direction = 'end',
  onPress,
  ...props
}: MessageScrollerButtonProps) {
  const runtime = useScrollerRuntime();
  const strings = useUiStrings();
  const edges = useSyncExternalStore(runtime.subscribe, runtime.edges, runtime.serverEdges);
  if (!edges[direction]) return null;
  return (
    <Button
      {...props}
      {...hooks.slot('button', { direction }, className)}
      onPress={(event) => {
        runtime.jump(direction);
        return onPress?.(event);
      }}
    >
      {children ?? (direction === 'end' ? strings.jumpToLatest : strings.scrollBackward)}
    </Button>
  );
}
