'use client';

import { type RefObject, type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import type { MiniAppState } from './mini-app-document.js';

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
  | { type: 'state'; value: MiniAppState }
  | { type: 'error'; message: string }
  | { type: 'focus'; visible: boolean }
  | { type: 'call'; id: number; name: string; args: unknown };

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
      return { type: 'state', value: data.value as MiniAppState };
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

/**
 * The lifecycle of one mini-app frame: it connects to the frame on its first `load`, settles
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
        latest.current.onStateChange?.(message.value);
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

  const onLoad = (event: SyntheticEvent<HTMLIFrameElement>) => {
    if (hasLoadedRef.current) {
      fail({ kind: 'navigation', message: 'The mini-app frame loaded another document.' });
      return;
    }
    hasLoadedRef.current = true;
    frameRef.current = event.currentTarget;
    const target = event.currentTarget.contentWindow;
    if (statusRef.current === 'error' || !target) return;
    const channel = new MessageChannel();
    const port = channel.port1;
    port.onmessage = (message) => {
      const read = readFrameMessage(message.data);
      if (read) receive(port, read);
    };
    portRef.current = port;
    // The frame's origin is opaque, so no target origin can name it; only the frame receives the port.
    target.postMessage({ type: 'ui-mini-app:connect' }, '*', [channel.port2]);
  };

  const { readyTimeout } = options;
  useEffect(() => {
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

  return { status, error, height, focusVisible, onLoad };
}
