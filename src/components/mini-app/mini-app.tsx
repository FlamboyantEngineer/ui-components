'use client';

import { useMemo, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { EmbeddedFrame } from '../layout/layout.js';
import {
  createMiniAppDocument,
  type MiniAppSource,
  type MiniAppState,
  readAllowedOrigins,
} from './mini-app-document.js';
import {
  type MiniAppCapability,
  type MiniAppError,
  useMiniAppSession,
} from './use-mini-app-session.js';

export interface MiniAppProps extends BaseProps, RefProps<HTMLDivElement> {
  /** Names the mini-app's frame for assistive technology, and its loading and failure messages. */
  title: string;
  /** The mini-app's markup, stylesheet and script. A change restarts the mini-app. */
  source: MiniAppSource;
  /**
   * The `https:` origins the mini-app may load scripts, styles, images, fonts and data from, such as
   * `https://cdn.example.org`. Without any, it reaches no network. A change restarts the mini-app.
   */
  allowedOrigins?: readonly string[] | undefined;
  /** The functions the mini-app may call by name through `miniApp.call(name, args)`. */
  capabilities?: Readonly<Record<string, MiniAppCapability>> | undefined;
  /** The state the mini-app reads as `miniApp.state`, read each time it starts. */
  initialState?: MiniAppState | undefined;
  /** Receives each state the mini-app saves through `miniApp.setState(state)`. */
  onStateChange?: ((state: MiniAppState) => void) | undefined;
  /** Called once the mini-app has loaded. */
  onReady?: (() => void) | undefined;
  /** Receives each error the mini-app reports or meets. */
  onError?: ((error: MiniAppError) => void) | undefined;
  /** How long the mini-app may take to load before it fails, in milliseconds. Defaults to 10000. */
  readyTimeout?: number | undefined;
}

type MiniAppSessionProps = Omit<MiniAppProps, 'allowedOrigins' | 'readyTimeout'> & {
  allowedOrigins: readonly string[];
  readyTimeout: number;
};

const hooks = createHooks('mini-app', ['frame', 'status']);

const defaultReadyTimeout = 10_000;

function readReadyTimeout(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : defaultReadyTimeout;
}

function MiniAppSession({
  title,
  source,
  allowedOrigins,
  capabilities,
  initialState,
  onStateChange,
  onReady,
  onError,
  readyTimeout,
  className,
  ...rest
}: MiniAppSessionProps) {
  const strings = useUiStrings();
  const locale = useLocale();
  // The document is made once per session: a later `initialState` waits for the next start.
  const [document] = useState(() =>
    createMiniAppDocument({ source, title, locale, allowedOrigins, initialState }),
  );
  const { status, error, height, focusVisible, onLoad } = useMiniAppSession({
    readyTimeout,
    capabilities,
    onReady,
    onError,
    onStateChange,
  });
  const message =
    status === 'loading'
      ? strings.miniAppLoading(title)
      : status === 'error'
        ? strings.miniAppFailed(title)
        : '';
  return (
    <div {...rest} {...hooks.root({ className, data: { status, error: error?.kind } })}>
      {/* A frame that navigated runs a document the host never vetted: it goes, not just hides. */}
      {error?.kind === 'navigation' ? null : (
        <EmbeddedFrame
          title={title}
          srcDoc={document}
          sandbox="allow-scripts allow-forms"
          referrerPolicy="no-referrer"
          grow={false}
          fill={false}
          hidden={status === 'error'}
          height={height}
          onLoad={onLoad}
          {...hooks.slot('frame', { focusVisible: focusVisible && status !== 'error' })}
        />
      )}
      <span role="status" {...hooks.slot('status')}>
        {message}
      </span>
    </div>
  );
}

/**
 * Runs a self-contained HTML, CSS and JavaScript mini-app in a sandboxed frame of its own origin.
 * It reaches the host only through the capabilities the host lends it and the state it saves, and
 * fetches only from `allowedOrigins`. No policy stops the frame from navigating itself to another
 * address; when it does, the session reports `navigation` and removes the frame.
 */
export function MiniApp({ allowedOrigins, readyTimeout, ...props }: MiniAppProps) {
  const origins = readAllowedOrigins(allowedOrigins);
  const { html, css, script } = props.source;
  const originsKey = origins.join(' ');
  // The source can be large: build the key only when a part of it changes.
  const sessionKey = useMemo(
    () => JSON.stringify([html, css ?? '', script ?? '', originsKey]),
    [html, css, script, originsKey],
  );
  return (
    <MiniAppSession
      key={sessionKey}
      {...props}
      allowedOrigins={origins}
      readyTimeout={readReadyTimeout(readyTimeout)}
    />
  );
}
