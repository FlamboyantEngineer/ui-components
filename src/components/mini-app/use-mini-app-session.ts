'use client';

import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import type { MiniAppState } from './mini-app-document.js';
import { isMiniAppState } from './mini-app-state.js';

/** Where a mini-app stands: starting, running, or stopped by an error. */
export type MiniAppStatus = 'loading' | 'ready' | 'error';

/**
 * Why a mini-app reported an error: an uncaught error or rejection in its code (`script`), no
 * `ready` within the timeout (`timeout`), or its frame loading another document (`navigation`).
 */
export type MiniAppErrorKind = 'script' | 'timeout' | 'navigation';

export interface MiniAppError {
  kind: MiniAppErrorKind;
  /** A description for the host's logs, in English. */
  message: string;
}

/**
 * A function the host lends a mini-app. It receives the arguments the mini-app passed (a structured
 * clone) and returns, or resolves to, a value the browser can clone back. A throw or rejection
 * rejects the mini-app's call with the error's message.
 */
export type MiniAppCapability = (args: unknown) => unknown;

export interface MiniAppSessionOptions {
  readyTimeout: number;
  capabilities: Readonly<Record<string, MiniAppCapability>> | undefined;
  onReady: (() => void) | undefined;
  onError: ((error: MiniAppError) => void) | undefined;
  onStateChange: ((state: MiniAppState) => void) | undefined;
}

type FrameMessage =
  | { type: 'ready' }
  | { type: 'resize'; height: number }
  | { type: 'state'; value: unknown }
  | { type: 'error'; message: string }
  | { type: 'focus'; visible: boolean }
  | { type: 'call'; id: number; name: string; args: unknown };

const invalidStateMessage = 'The mini-app saved a state that is not a JSON value; it was dropped.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** The message a frame posted, or `undefined` when it is not one the bridge sends. */
function readFrameMessage(data: unknown): FrameMessage | undefined {
  if (!isRecord(data)) return undefined;
  switch (data.type) {
    case 'ready':
      return { type: 'ready' };
    case 'resize':
      return typeof data.height === 'number' && Number.isFinite(data.height) && data.height >= 0
        ? { type: 'resize', height: data.height }
        : undefined;
    case 'state':
      return { type: 'state', value: data.value };
    case 'error':
      return typeof data.message === 'string'
        ? { type: 'error', message: data.message }
        : undefined;
    case 'focus':
      return typeof data.visible === 'boolean'
        ? { type: 'focus', visible: data.visible }
        : undefined;
    case 'call':
      return typeof data.id === 'number' && typeof data.name === 'string'
        ? { type: 'call', id: data.id, name: data.name, args: data.args }
        : undefined;
    default:
      return undefined;
  }
}

const frameEdges = ['border-top-width', 'border-bottom-width', 'padding-top', 'padding-bottom'];

/**
 * What a border-box frame adds around its document: the borders and padding a host stylesheet
 * gives it, which the `height` attribute then includes. A content-box frame adds nothing.
 */
function measureFrameEdges(frame: HTMLIFrameElement | null): number {
  const style = frame?.ownerDocument.defaultView?.getComputedStyle(frame);
  if (style?.boxSizing !== 'border-box') return 0;
  return frameEdges.reduce((sum, edge) => sum + (parseFloat(style.getPropertyValue(edge)) || 0), 0);
}

/**
 * Whether the host stylesheet holds `frame` shorter than the `content` it reports, for example with
 * `max-height`, so the mini-app must scroll inside it.
 */
function isFrameCapped(frame: HTMLIFrameElement, content: number): boolean {
  const style = frame.ownerDocument.defaultView?.getComputedStyle(frame);
  const padding = style
    ? (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
    : 0;
  return frame.clientHeight - padding + 0.5 < content;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs a capability and posts its result or failure back on `port`. */
async function answerCall(
  port: MessagePort,
  call: { id: number; name: string; args: unknown },
  capabilities: Readonly<Record<string, MiniAppCapability>> | undefined,
) {
  const capability =
    capabilities && Object.hasOwn(capabilities, call.name) ? capabilities[call.name] : undefined;
  try {
    if (!capability) throw new Error(`The host offers no capability named "${call.name}".`);
    const value: unknown = await capability(call.args);
    port.postMessage({ id: call.id, ok: true, value });
  } catch (error) {
    port.postMessage({ id: call.id, ok: false, message: describeError(error) });
  }
}

interface FrameScrollCapOptions {
  frameRef: RefObject<HTMLIFrameElement | null>;
  portRef: RefObject<MessagePort | null>;
  contentHeightRef: RefObject<number>;
  height: number | undefined;
}

/**
 * Tells the bridge whether its document may scroll. The frame follows its content, so the mini-app
 * scrolls only while the host stylesheet caps the frame; a scrollbar it never needs would narrow its
 * content and so change the height it reports.
 */
function useFrameScrollCap({ frameRef, portRef, contentHeightRef, height }: FrameScrollCapOptions) {
  const scrollsRef = useRef(false);
  useEffect(() => {
    const frame = frameRef.current;
    const port = portRef.current;
    if (!frame || !port || height === undefined) return;
    const check = () => {
      const scrolls = isFrameCapped(frame, contentHeightRef.current);
      if (scrolls === scrollsRef.current) return;
      scrollsRef.current = scrolls;
      port.postMessage({ type: 'scroll', enabled: scrolls });
    };
    check();
    // A stylesheet that changes the frame's limits, such as `max-height`, resizes the frame.
    const Observer = frame.ownerDocument.defaultView?.ResizeObserver;
    if (!Observer) return;
    const observer = new Observer(check);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frameRef, portRef, contentHeightRef, height]);
}

/** Closes the frame's channel when the session unmounts. */
function useClosePortOnUnmount(portRef: RefObject<MessagePort | null>) {
  useEffect(
    () => () => {
      portRef.current?.close();
      portRef.current = null;
    },
    [portRef],
  );
}

interface BridgePortOptions {
  frameRef: RefObject<HTMLIFrameElement | null>;
  portRef: RefObject<MessagePort | null>;
  /** Reads what arrives on the port taken. */
  onPortMessage: RefObject<(port: MessagePort, data: unknown) => void>;
}

/**
 * Takes the port the frame's bridge opens: the first `ui-mini-app:connect` message with a port from
 * the frame's window. The bridge is the first script of the vetted document, so its message is posted
 * before any of the mini-app's code runs, and before any document the frame navigates to could post
 * one; messages from one window arrive in the order they were posted, so a later document never
 * reaches the channel. It listens from the commit that inserts the frame, before its document runs.
 */
function useBridgePort({ frameRef, portRef, onPortMessage }: BridgePortOptions) {
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const owner = frame?.ownerDocument.defaultView;
    if (!frame || !owner) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (portRef.current || event.source !== frame.contentWindow) return;
      const port = event.ports[0];
      if (!port || !isRecord(event.data) || event.data.type !== 'ui-mini-app:connect') return;
      port.onmessage = (message) => onPortMessage.current(port, message.data);
      portRef.current = port;
    };
    owner.addEventListener('message', onMessage);
    return () => owner.removeEventListener('message', onMessage);
  }, [frameRef, portRef, onPortMessage]);
}

/**
 * The lifecycle of one mini-app frame: it takes the channel its bridge opens, settles
 * `loading` into `ready` or `error`, follows the height and keyboard focus the frame reports, answers
 * capability calls and closes the channel on unmount.
 */
export function useMiniAppSession(options: MiniAppSessionOptions) {
  const latest = useLatest(options);
  const [status, setStatus] = useState<MiniAppStatus>('loading');
  const [error, setError] = useState<MiniAppError>();
  const [height, setHeight] = useState<number>();
  const [focusVisible, setFocusVisible] = useState(false);
  const statusRef = useRef<MiniAppStatus>('loading');
  const portRef = useRef<MessagePort>(null);
  const hasLoadedRef = useRef(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const contentHeightRef = useRef(0);

  const fail = (next: MiniAppError) => {
    if (statusRef.current === 'error') return;
    statusRef.current = 'error';
    setStatus('error');
    setError(next);
    portRef.current?.close();
    portRef.current = null;
    latest.current.onError?.(next);
  };

  const receive = (port: MessagePort, message: FrameMessage) => {
    switch (message.type) {
      case 'ready':
        if (statusRef.current !== 'loading') return;
        statusRef.current = 'ready';
        setStatus('ready');
        latest.current.onReady?.();
        return;
      case 'resize':
        contentHeightRef.current = message.height;
        setHeight(Math.ceil(message.height + measureFrameEdges(frameRef.current)));
        return;
      case 'state':
        if (isMiniAppState(message.value)) latest.current.onStateChange?.(message.value);
        else latest.current.onError?.({ kind: 'script', message: invalidStateMessage });
        return;
      case 'error':
        if (statusRef.current === 'loading') fail({ kind: 'script', message: message.message });
        else latest.current.onError?.({ kind: 'script', message: message.message });
        return;
      case 'focus':
        setFocusVisible(message.visible);
        return;
      case 'call':
        void answerCall(port, message, latest.current.capabilities);
        return;
    }
  };

  const onPortMessage = useLatest((port: MessagePort, data: unknown) => {
    const read = readFrameMessage(data);
    if (read) receive(port, read);
  });
  useBridgePort({ frameRef, portRef, onPortMessage });

  const onLoad = () => {
    if (hasLoadedRef.current) {
      fail({ kind: 'navigation', message: 'The mini-app frame loaded another document.' });
      return;
    }
    hasLoadedRef.current = true;
  };

  const { readyTimeout } = options;
  // The time runs from the commit that inserts the frame, as the channel does: the bridge can say
  // `ready` before passive effects run, and a timer started then would give it longer.
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      if (statusRef.current !== 'loading') return;
      fail({ kind: 'timeout', message: `The mini-app was not ready within ${readyTimeout} ms.` });
    }, readyTimeout);
    return () => clearTimeout(timer);
    // `fail` reads only refs and setters, so the timer restarts only when the timeout changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyTimeout]);

  useFrameScrollCap({ frameRef, portRef, contentHeightRef, height });

  useClosePortOnUnmount(portRef);

  return { status, error, height, focusVisible, frameRef, onLoad };
}
