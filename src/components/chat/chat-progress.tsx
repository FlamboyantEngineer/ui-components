'use client';

import { type ReactNode, useCallback, useState } from 'react';
import { ClockGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { isThenable } from '../../utils/is-thenable.js';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
import { useLatest } from '../../utils/use-latest.js';
import { composerSubmittingDelay } from '../message-composer/composer-controls.js';
import { Spinner } from '../progress-bar/progress-bar.js';
import { chatHooks as hooks } from './chat-hooks.js';

/**
 * What the reader did that the host has not accepted yet: sent a message, queued one while a reply
 * runs, steered with a queued one, saved an edit, or removed a queued message.
 */
export type ChatProgressAction = 'send' | 'queue' | 'steer' | 'save' | 'remove';

/**
 * How long the host may take before the chat shows that it waits, so a quick answer never flashes;
 * the composer's action button waits as long.
 */
export const chatProgressDelay = composerSubmittingDelay;

interface Waiting {
  key: number;
  action: ChatProgressAction;
  conversationId: string | undefined;
}

export interface ChatProgress {
  /** The latest action the shown conversation still waits for. */
  action: ChatProgressAction | undefined;
  /** Waits with `action` for a host callback's result, when it is a promise, and returns it as is. */
  track: <T>(action: ChatProgressAction, result: T) => T;
}

/**
 * The host's answers the chat waits for, each in the conversation it was given in, so switching
 * conversations neither shows another one's wait nor loses it.
 */
export function useChatProgress(conversationId: string | undefined): ChatProgress {
  const [waiting, setWaiting] = useState<readonly Waiting[]>([]);
  const [nextKey] = useState(() => ({ current: 0 }));
  const latestConversation = useLatest(conversationId);
  const track = useCallback(
    <T,>(action: ChatProgressAction, result: T): T => {
      if (!isThenable(result)) return result;
      nextKey.current += 1;
      const entry = { key: nextKey.current, action, conversationId: latestConversation.current };
      setWaiting((list) => [...list, entry]);
      const settle = () => setWaiting((list) => list.filter((item) => item !== entry));
      result.then(settle, settle);
      return result;
    },
    [latestConversation, nextKey],
  );
  const shown = waiting.findLast((entry) => entry.conversationId === conversationId);
  return { action: shown?.action, track };
}

interface ChatProgressLineProps {
  action: ChatProgressAction | undefined;
  /** In place of the clock glyph: `true` for the library's spinner, or an element. */
  icon: ReactNode;
}

/**
 * The line above the composer saying what the chat waits for the host to accept ("Sending…"), once
 * it has waited `chatProgressDelay`. It is a polite live region, present while the composer is, so
 * the line is announced once as it appears.
 */
export function ChatProgressLine({ action, icon }: ChatProgressLineProps) {
  const strings = useUiStrings();
  const isShown = useActiveAfter(action !== undefined, chatProgressDelay);
  const shownAction = isShown ? action : undefined;
  return (
    <div {...hooks.slot('progress', { action: shownAction })} role="status">
      {shownAction ? (
        <>
          <ProgressIcon icon={icon} />
          <span {...hooks.slot('progress-label')}>{strings.chatProgress(shownAction)}</span>
        </>
      ) : null}
    </div>
  );
}

/** The clock a message waiting for delivery shows, the library's spinner (`true`) or the host's icon. */
function ProgressIcon({ icon }: { icon: ReactNode }) {
  if (icon === true) return <Spinner size="sm" className={hooks.slotClass('progress-icon')} />;
  if (icon === false || isEmptyNode(icon)) {
    return <Glyph icon={ClockGlyph} className={hooks.slotClass('progress-icon')} />;
  }
  return (
    <span {...hooks.slot('progress-icon')} aria-hidden="true">
      {icon}
    </span>
  );
}
